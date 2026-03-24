import { NextRequest, NextResponse } from "next/server";
import { getUserBySession } from "@/lib/users-db";
import { deleteAgentFromPool, getAgentPool, upsertAgent } from "@/lib/agents-db";

function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  const user = getUserBySession(token);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(getAgentPool());
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  try {
    const agent = upsertAgent(body);
    return NextResponse.json(agent);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Invalid agent" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { agentId } = await req.json();
  if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });
  const ok = deleteAgentFromPool(String(agentId));
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
