import { NextRequest } from "next/server";
import { getUserBySession } from "@/lib/users-db";
import { findAgentInPool } from "@/lib/agents-db";
import { buildSessionKey, getOpenClawConfig } from "@/lib/openclaw";

function encodeEvent(encoder: TextEncoder, event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function parseSSEBlocks(raw: string): string[] {
  const blocks = raw.split("\n\n");
  const datas: string[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) datas.push(line.slice(6));
    }
  }
  return datas;
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = getUserBySession(session);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { text, agentId } = await req.json();
  if (!text) {
    return new Response(JSON.stringify({ error: "text is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resolvedAgentId: string | undefined =
    (typeof agentId === "string" && agentId) || user.agents?.[0]?.agentId;

  if (!resolvedAgentId) {
    return new Response(JSON.stringify({ error: "No agent assigned" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!user.agents?.some((a) => a.agentId === resolvedAgentId)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Look up per-agent gateway/token from agent pool, fallback to global OpenClaw config
  const poolAgent = findAgentInPool(resolvedAgentId);
  const globalConfig = getOpenClawConfig();

  const agentGateway = (poolAgent?.gateway || globalConfig.baseUrl).replace(/\/$/, "");
  const agentToken = poolAgent?.token || globalConfig.token;

  if (!agentToken) {
    return new Response(JSON.stringify({ error: "Agent gateway not configured (no token)" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ocAgentId = resolvedAgentId || globalConfig.defaultAgentId;
  const sessionKey = buildSessionKey(user.userId, ocAgentId);

  const messageId = `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let accumulated = "";

      controller.enqueue(
        encodeEvent(encoder, "assistant_start", {
          messageId,
          createdAt: Date.now(),
        })
      );

      try {
        const upstream = await fetch(`${agentGateway}/v1/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${agentToken}`,
            "Content-Type": "application/json",
            "x-clawdbot-agent-id": ocAgentId,
            "x-clawdbot-session-key": sessionKey,
          },
          body: JSON.stringify({
            model: `clawdbot:${ocAgentId}`,
            stream: true,
            user: user.userId,
            messages: [{ role: "user", content: text }],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          controller.enqueue(
            encodeEvent(encoder, "error", {
              message: `Upstream error: ${upstream.status}`,
              code: "UPSTREAM_ERROR",
            })
          );
          controller.enqueue(encodeEvent(encoder, "done", { ok: false }));
          controller.close();
          return;
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lastDoubleNewline = buffer.lastIndexOf("\n\n");
          if (lastDoubleNewline === -1) continue;

          const complete = buffer.slice(0, lastDoubleNewline + 2);
          buffer = buffer.slice(lastDoubleNewline + 2);

          const datas = parseSSEBlocks(complete);
          for (const dataLine of datas) {
            if (dataLine === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataLine);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                accumulated += delta;
                controller.enqueue(encodeEvent(encoder, "assistant_delta", { messageId, delta }));
              }
            } catch {
              // ignore
            }
          }
        }

        controller.enqueue(encodeEvent(encoder, "assistant_final", { messageId, content: accumulated }));
        controller.enqueue(encodeEvent(encoder, "done", { ok: true }));
        controller.close();
      } catch (e: any) {
        controller.enqueue(
          encodeEvent(encoder, "error", {
            message: e?.message || "Connection failed",
            code: "CONNECTION_FAILED",
          })
        );
        controller.enqueue(encodeEvent(encoder, "done", { ok: false }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
