import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/users-db";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (token) deleteSession(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("session");
  return response;
}
