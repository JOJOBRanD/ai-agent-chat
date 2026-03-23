import { NextRequest, NextResponse } from "next/server";
import { getUploadsDir } from "@/lib/users-db";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const uploadsDir = getUploadsDir();
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".json": "application/json",
    ".csv": "text/csv",
    ".zip": "application/zip",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
  };

  const contentType = mimeMap[ext] || "application/octet-stream";
  const isInline = contentType.startsWith("image/") || contentType === "application/pdf";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": isInline ? "inline" : `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
