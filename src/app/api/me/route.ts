import { NextRequest, NextResponse } from "next/server";
import { getUserBySession, updateUser } from "@/lib/users-db";

function getUser(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  return getUserBySession(token) || null;
}

function formatUser(user: NonNullable<ReturnType<typeof getUser>>) {
  return {
    userId: user.userId,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar ? `/api/upload/avatar/${user.avatar}` : undefined,
    role: user.role,
    agents: (user.agents || []).map(({ gateway, token, ...a }) => a),
  };
}

// GET /api/me
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(formatUser(user));
}

// PUT /api/me — update profile (displayName, avatar)
export async function PUT(req: NextRequest) {
  const user = getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { displayName, avatar } = await req.json();
  const updates: Record<string, string> = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (avatar !== undefined) updates.avatar = avatar;

  const updated = updateUser(user.userId, updates);
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json(formatUser(updated));
}
