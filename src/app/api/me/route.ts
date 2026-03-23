import { NextRequest, NextResponse } from "next/server";
import { getUserBySession } from "@/lib/users-db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = getUserBySession(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    userId: user.userId,
    username: user.username,
    displayName: user.displayName,
    agentName: user.agentName,
    role: user.role,
  });
}
