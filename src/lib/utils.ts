import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Simulate streaming text for demo purposes
export async function* simulateStream(text: string): AsyncGenerator<string> {
  const words = text.split("");
  for (const char of words) {
    yield char;
    // Random delay to simulate natural typing
    await new Promise((resolve) =>
      setTimeout(resolve, 10 + Math.random() * 30)
    );
  }
}

// Demo response with rich markdown
export const DEMO_RESPONSES: string[] = [
  `## Analysis Complete

Here's what I found:

### Key Insights

1. **Performance Optimization** - The current architecture shows room for improvement in several areas.

2. **Code Quality** - Overall the codebase follows good practices, with a few notable exceptions.

3. **Security Audit** - No critical vulnerabilities detected.

\`\`\`typescript
// Example optimization suggestion
const memoizedValue = useMemo(() => {
  return expensiveComputation(data);
}, [data]);

// Before: O(n²) complexity
// After: O(n log n) with proper indexing
\`\`\`

> **Note:** These recommendations are based on static analysis. Dynamic profiling may reveal additional opportunities.

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Load Time | 3.2s | 1.1s | **65.6%** |
| Bundle Size | 420KB | 180KB | **57.1%** |
| FCP | 2.1s | 0.8s | **61.9%** |

Would you like me to dive deeper into any of these areas?`,

  `Great question! Let me break this down step by step.

### Understanding the Architecture

The system uses a **microservices pattern** with the following components:

\`\`\`mermaid
graph LR
    A[Client] --> B[API Gateway]
    B --> C[Auth Service]
    B --> D[Chat Service]
    B --> E[ML Pipeline]
    E --> F[Model Inference]
\`\`\`

Here's a quick implementation example:

\`\`\`python
import asyncio
from typing import AsyncGenerator

async def stream_response(prompt: str) -> AsyncGenerator[str, None]:
    """Stream tokens from the AI model."""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.example.com/v1/chat",
            json={"prompt": prompt, "stream": True}
        ) as response:
            async for chunk in response.content:
                yield chunk.decode("utf-8")
\`\`\`

The key benefits of this approach:

- **Scalability** — Each service scales independently
- **Resilience** — Failure isolation between components
- **Flexibility** — Easy to swap or upgrade individual services

Let me know if you'd like to see the deployment configuration!`,

  `### Here's the solution

I've identified the root cause and prepared a fix:

\`\`\`javascript
// Fix: Race condition in concurrent state updates
const handleSubmit = useCallback(async (input) => {
  // Use functional update to avoid stale closure
  setMessages(prev => [...prev, { role: 'user', content: input }]);

  try {
    const response = await fetchAIResponse(input);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: response
    }]);
  } catch (error) {
    console.error('Failed to fetch response:', error);
    toast.error('Something went wrong. Please try again.');
  }
}, []);
\`\`\`

**What changed:**
- Replaced direct state mutation with functional updates
- Added proper error boundaries
- Implemented retry logic with exponential backoff

The math behind the backoff strategy:

$$delay = \\min(baseDelay \\times 2^{attempt}, maxDelay)$$

This ensures we don't overwhelm the server while maintaining responsive recovery. Want me to implement the full error handling?`,
];

export function getRandomResponse(): string {
  return DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
}
