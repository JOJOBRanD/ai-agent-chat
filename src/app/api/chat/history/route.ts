import { NextRequest, NextResponse } from "next/server";
import { getUserBySession } from "@/lib/users-db";
import { buildSessionKey, getOpenClawConfig, toAppMessagesFromSessionsHistory } from "@/lib/openclaw";

function getAuthedUser(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  return getUserBySession(token) || null;
}

// GET /api/chat/history?agentId=xxx
export async function GET(req: NextRequest) {
  const user = getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agentId = req.nextUrl.searchParams.get("agentId");
  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  // Authorization: agent must be assigned to this user
  if (!user.agents?.some((a) => a.agentId === agentId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { baseUrl, token } = getOpenClawConfig();
  if (!token) return NextResponse.json([]);

  const sessionKey = buildSessionKey(user.userId, agentId);

  try {
    const resp = await fetch(`${baseUrl}/tools/invoke`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tool: "sessions_history",
        args: {
          sessionKey,
          limit: 200,
          includeTools: false,
        },
      }),
    });

    if (!resp.ok) return NextResponse.json([]);

    const data = (await resp.json()) as any;
    const result = data?.result ?? data;
    return NextResponse.json(toAppMessagesFromSessionsHistory(result));
  } catch {
    return NextResponse.json([]);
  }
}

// POST /api/chat/history
// Legacy endpoint kept for backward compatibility. History is stored in OpenClaw.
export async function POST() {
  return NextResponse.json({ ok: true });
}
