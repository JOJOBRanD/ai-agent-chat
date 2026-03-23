import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createSession } from "@/lib/users-db";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const user = authenticateUser(username, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createSession(user.username);

  const response = NextResponse.json({
    userId: user.userId,
    username: user.username,
    displayName: user.displayName,
    agentName: user.agentName,
    role: user.role,
  });

  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
