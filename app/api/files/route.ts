import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { FileRecordType } from "@/types/file-record";

type CreateFilePayload = {
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  name: string;
  type?: FileRecordType;
  size: string;
  uploadedAt?: string | null;
};

export async function GET() {
  try {
    const files = await prisma.fileRecord.findMany({
      orderBy: {
        uploadedAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      files,
    });
  } catch (error) {
    console.error("File GET error:", error);

    return NextResponse.json(
      { error: "Failed to load files." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateFilePayload;

    if (!payload.name || !payload.size) {
      return NextResponse.json(
        { error: "Missing required file fields." },
        { status: 400 }
      );
    }

    const file = await prisma.fileRecord.create({
      data: {
        clientId: payload.clientId,
        clientName: payload.clientName,
        projectId: payload.projectId,
        projectName: payload.projectName,
        name: payload.name,
        type: payload.type ?? "Document",
        size: payload.size,
        uploadedAt: payload.uploadedAt ? new Date(payload.uploadedAt) : undefined,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        file,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("File POST error:", error);

    return NextResponse.json(
      { error: "Failed to create file." },
      { status: 500 }
    );
  }
}
