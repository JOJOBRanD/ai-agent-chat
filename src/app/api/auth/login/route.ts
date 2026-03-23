import { NextRequest, NextResponse } from "next/server";

// Mock login — 后续对接真实后端时替换
export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  // Mock: 任何用户名+密码都能登录
  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password required" },
      { status: 400 }
    );
  }

  // Mock 验证（demo 模式：admin/admin 或任意账号）
  const user = {
    userId: "user_001",
    username: username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    agentName: "AI Agent Pro",
    agentAvatar: null,
  };

  const response = NextResponse.json(user);

  // 设置 mock cookie
  response.cookies.set("session", "mock_session_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
