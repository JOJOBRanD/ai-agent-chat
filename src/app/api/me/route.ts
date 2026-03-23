import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session")?.value;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Mock user info
  return NextResponse.json({
    userId: "user_001",
    username: "demo",
    displayName: "Demo User",
    agentName: "AI Agent Pro",
    agentAvatar: null,
  });
}
