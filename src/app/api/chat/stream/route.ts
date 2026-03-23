import { NextRequest } from "next/server";

// Mock streaming response — 模拟后端 SSE 输出
// 后续对接 OpenClaw / OpenAI 时替换此路由

const MOCK_RESPONSE = `## Analysis Complete

Here's what I found:

### Key Insights

1. **Performance Optimization** — The current architecture shows room for improvement.

2. **Code Quality** — Overall the codebase follows good practices.

\`\`\`typescript
// Example optimization
const memoized = useMemo(() => {
  return expensiveComputation(data);
}, [data]);
\`\`\`

> **Note:** These are based on static analysis.

| Metric | Before | After |
|--------|--------|-------|
| Load Time | 3.2s | 1.1s |
| Bundle Size | 420KB | 180KB |

Would you like me to dive deeper?`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { text } = await req.json();
  if (!text) {
    return new Response(JSON.stringify({ error: "text is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messageId = "a_" + Math.random().toString(36).substring(2, 12);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // assistant_start
      controller.enqueue(
        encoder.encode(
          `event: assistant_start\ndata: ${JSON.stringify({
            messageId,
            createdAt: Date.now(),
          })}\n\n`
        )
      );

      await sleep(300);

      // assistant_delta — 逐字输出
      const chars = MOCK_RESPONSE.split("");
      let accumulated = "";
      for (const char of chars) {
        accumulated += char;
        controller.enqueue(
          encoder.encode(
            `event: assistant_delta\ndata: ${JSON.stringify({
              messageId,
              delta: char,
            })}\n\n`
          )
        );
        // 模拟打字速度
        await sleep(8 + Math.random() * 15);
      }

      // assistant_final
      controller.enqueue(
        encoder.encode(
          `event: assistant_final\ndata: ${JSON.stringify({
            messageId,
            content: accumulated,
            usage: { prompt_tokens: 50, completion_tokens: accumulated.length },
          })}\n\n`
        )
      );

      // done
      controller.enqueue(
        encoder.encode(
          `event: done\ndata: ${JSON.stringify({ ok: true })}\n\n`
        )
      );

      controller.close();
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
