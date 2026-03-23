import { NextRequest, NextResponse } from "next/server";
import { getUserBySession, getAllUsers, addUser, updateUser, deleteUser } from "@/lib/users-db";

// 鉴权：必须是 admin
function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  const user = getUserBySession(token);
  if (!user || user.role !== "admin") return null;
  return user;
}

// GET: 获取所有普通用户
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = getAllUsers().map((u) => ({
    userId: u.userId,
    username: u.username,
    displayName: u.displayName,
    agentName: u.agentName,
    createdAt: u.createdAt,
  }));

  return NextResponse.json(users);
}

// POST: 新增用户
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username, password, displayName, agentName } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "username and password required" }, { status: 400 });
  }

  try {
    const user = addUser({
      username,
      password,
      displayName: displayName || username,
      agentName: agentName || "AI Agent",
    });
    return NextResponse.json({
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      agentName: user.agentName,
      createdAt: user.createdAt,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}

// PUT: 更新用户
export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, ...data } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const user = updateUser(userId, data);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      agentName: user.agentName,
      createdAt: user.createdAt,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}

// DELETE: 删除用户
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const ok = deleteUser(userId);
  if (!ok) {
    return NextResponse.json({ error: "User not found or cannot delete" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
