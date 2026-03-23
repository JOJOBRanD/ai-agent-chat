import { NextRequest, NextResponse } from "next/server";
import { getUserBySession, loadChatHistory, saveChatHistory } from "@/lib/users-db";

// GET /api/chat/history?agentId=xxx
export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = getUserBySession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agentId = req.nextUrl.searchParams.get("agentId") || "agent_default";
  const messages = loadChatHistory(user.userId, agentId);

  return NextResponse.json(messages);
}

// POST /api/chat/history — save messages for an agent
export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = getUserBySession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId, messages } = await req.json();
  if (!agentId || !Array.isArray(messages)) {
    return NextResponse.json({ error: "agentId and messages required" }, { status: 400 });
  }

  saveChatHistory(user.userId, agentId, messages);
  return NextResponse.json({ ok: true });
}
