import type {
  SSEEventType,
  SSEAssistantStart,
  SSEAssistantDelta,
  SSEAssistantFinal,
  SSEError,
  SSEDone,
} from "./types";

// === SSE 事件回调 ===
export interface SSECallbacks {
  onAssistantStart: (data: SSEAssistantStart) => void;
  onAssistantDelta: (data: SSEAssistantDelta) => void;
  onAssistantFinal: (data: SSEAssistantFinal) => void;
  onError: (data: SSEError) => void;
  onDone: (data: SSEDone) => void;
  onConnectionError: (error: Error) => void;
}

/**
 * 解析 SSE 文本行，提取 event + data
 * SSE 格式：
 *   event: xxx
 *   data: {"key":"value"}
 *   (空行分隔)
 */
function parseSSELines(raw: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = [];
  const blocks = raw.split("\n\n");

  for (const block of blocks) {
    if (!block.trim()) continue;

    let event = "";
    let data = "";
    const lines = block.split("\n");

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        event = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        data = line.slice(6);
      }
    }

    if (event && data) {
      events.push({ event, data });
    }
  }

  return events;
}

/**
 * 发送消息并以 fetch + ReadableStream 方式读取 SSE 流
 * 返回 AbortController 以支持中断
 */
export function streamChat(
  text: string,
  callbacks: SSECallbacks,
  agentId?: string
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, agentId }),
        signal: controller.signal,
        credentials: "include",
      });

      // 鉴权失败
      if (response.status === 401 || response.status === 403) {
        callbacks.onError({
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
        return;
      }

      if (!response.ok) {
        callbacks.onError({
          message: `Server error: ${response.status}`,
          code: "SERVER_ERROR",
        });
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError({
          message: "No response body",
          code: "NO_BODY",
        });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 尝试按 \n\n 分割完整的 SSE 事件块
        const lastDoubleNewline = buffer.lastIndexOf("\n\n");
        if (lastDoubleNewline === -1) continue;

        const completePart = buffer.slice(0, lastDoubleNewline + 2);
        buffer = buffer.slice(lastDoubleNewline + 2);

        const events = parseSSELines(completePart);

        for (const { event, data } of events) {
          try {
            const parsed = JSON.parse(data);

            switch (event as SSEEventType) {
              case "assistant_start":
                callbacks.onAssistantStart(parsed);
                break;
              case "assistant_delta":
                callbacks.onAssistantDelta(parsed);
                break;
              case "assistant_final":
                callbacks.onAssistantFinal(parsed);
                break;
              case "error":
                callbacks.onError(parsed);
                break;
              case "done":
                callbacks.onDone(parsed);
                break;
            }
          } catch {
            // JSON parse failed, skip
          }
        }
      }

      // 处理 buffer 中残余数据
      if (buffer.trim()) {
        const events = parseSSELines(buffer);
        for (const { event, data } of events) {
          try {
            const parsed = JSON.parse(data);
            switch (event as SSEEventType) {
              case "assistant_start":
                callbacks.onAssistantStart(parsed);
                break;
              case "assistant_delta":
                callbacks.onAssistantDelta(parsed);
                break;
              case "assistant_final":
                callbacks.onAssistantFinal(parsed);
                break;
              case "error":
                callbacks.onError(parsed);
                break;
              case "done":
                callbacks.onDone(parsed);
                break;
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // 用户主动中断，不算错误
        return;
      }
      callbacks.onConnectionError(
        err instanceof Error ? err : new Error("Connection failed")
      );
    }
  })();

  return controller;
}
