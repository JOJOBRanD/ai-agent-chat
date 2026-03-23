import { NextRequest, NextResponse } from "next/server";
import { getUserBySession, updateUser, getAvatarDir } from "@/lib/users-db";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = getUserBySession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // 验证是图片
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  }

  // 限制 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "png";
  const filename = `${user.userId}_${Date.now()}.${ext}`;
  const avatarDir = getAvatarDir();
  const filePath = path.join(avatarDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const url = `/api/upload/avatar/${filename}`;

  // 更新用户头像
  updateUser(user.userId, { avatar: filename });

  return NextResponse.json({ url });
}

// 静态文件服务 — 通过 catch-all 处理
// 注意：需要额外的 [filename] route 来 serve 图片
