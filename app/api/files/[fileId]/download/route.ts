import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth/require-auth";

const FILE_UPLOADS_DIR = path.join(process.cwd(), "uploads", "files");

function sanitizeDownloadName(fileName: string) {
  return path.basename(fileName).replace(/[\r\n"]/g, "_") || "download";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { fileId } = await params;
    const file = await prisma.fileRecord.findUnique({
      where: {
        id: fileId,
      },
    });

    if (!file?.relativePath) {
      return NextResponse.json(
        { error: "File download is not available." },
        { status: 404 }
      );
    }

    const storageName = path.basename(file.relativePath);
    const storagePath = path.join(FILE_UPLOADS_DIR, storageName);

    const data = await readFile(storagePath);
    const downloadName = sanitizeDownloadName(file.originalName ?? file.name);

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Content-Length": String(data.length),
        "Content-Type": file.mimeType ?? "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("File download error:", error);

    return NextResponse.json(
      { error: "Failed to download file." },
      { status: 500 }
    );
  }
}
