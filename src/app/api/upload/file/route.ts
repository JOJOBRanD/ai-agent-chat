import { NextRequest, NextResponse } from "next/server";
import { getUserBySession, getUploadsDir } from "@/lib/users-db";
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

  // 限制 20MB
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
  }

  const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const ext = file.name.split(".").pop() || "bin";
  const safeFilename = `${id}.${ext}`;
  const uploadsDir = getUploadsDir();
  const filePath = path.join(uploadsDir, safeFilename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const url = `/api/upload/file/${safeFilename}`;
  const isImage = file.type.startsWith("image/");

  return NextResponse.json({
    id,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    url,
    previewUrl: isImage ? url : undefined,
  });
}
