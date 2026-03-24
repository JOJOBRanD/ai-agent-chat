import type { Message } from "./types";

export interface OpenClawConfig {
  baseUrl: string;
  token: string;
  defaultAgentId: string;
}

export function getOpenClawConfig(): OpenClawConfig {
  const baseUrl = (
    process.env.OPENCLAW_GATEWAY_URL ||
    process.env.OPENCLAW_URL ||
    "http://127.0.0.1:18789"
  ).replace(/\/$/, "");

  const token = process.env.OPENCLAW_GATEWAY_TOKEN || process.env.OPENCLAW_TOKEN || "";
  const defaultAgentId = process.env.OPENCLAW_AGENT_ID || "main";

  return { baseUrl, token, defaultAgentId };
}

export function buildSessionKey(userId: string, agentId: string): string {
  // Per spec: isolate by user + agent.
  return `web:${userId}:${agentId}`;
}

export function toAppMessagesFromSessionsHistory(result: unknown): Message[] {
  // Gateway versions may return different shapes.
  // Accept: array of items, or {messages:[...]}.
  const arr = Array.isArray(result)
    ? result
    : (result && typeof result === "object" && Array.isArray((result as any).messages)
        ? (result as any).messages
        : []);

  const messages: Message[] = [];
  for (const item of arr as any[]) {
    const role = item?.role;
    const content = item?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;

    const id = String(item?.id || item?.messageId || item?.eventId || `hist_${Math.random().toString(36).slice(2)}`);
    const timestamp =
      (typeof item?.createdAt === "number" && item.createdAt) ||
      (typeof item?.timestamp === "number" && item.timestamp) ||
      Date.now();

    messages.push({
      id,
      role,
      content,
      status: "done",
      timestamp,
    });
  }

  return messages;
}
