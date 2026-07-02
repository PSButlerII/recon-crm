import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { FileRecordType } from "@/types/file-record";
import { requireApiAuth } from "@/lib/auth/require-auth";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const FILE_UPLOADS_DIR = path.join(UPLOADS_ROOT, "files");

const FILE_RECORD_TYPES: FileRecordType[] = [
  "Document",
  "Image",
  "Contract",
  "Invoice",
  "Reference",
  "Deliverable",
];

type CreateFilePayload = {
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  name: string;
  originalName?: string;
  mimeType?: string;
  type?: FileRecordType;
  size: string;
  sizeBytes?: number;
  storagePath?: string;
  relativePath?: string;
  uploadedAt?: string | null;
};

function optionalString(value: FormDataEntryValue | string | undefined | null) {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

function normalizeFileType(value?: string | null): FileRecordType {
  if (value && FILE_RECORD_TYPES.includes(value as FileRecordType)) {
    return value as FileRecordType;
  }

  return "Document";
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeFileName(fileName: string) {
  const baseName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const trimmed = baseName.replace(/^\.+/, "").slice(0, 120);

  return trimmed || "upload";
}

function getRelativeUploadPath(storageName: string) {
  return path.posix.join("uploads", "files", storageName);
}

export async function GET() {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }
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

async function createMultipartFileRecord(request: Request) {
  const formData = await request.formData();
  const uploadedFile = formData.get("file");

  if (!(uploadedFile instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  if (uploadedFile.size <= 0) {
    return NextResponse.json({ error: "File is empty." }, { status: 400 });
  }

  if (uploadedFile.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "File exceeds the 10 MB upload limit." },
      { status: 400 }
    );
  }

  const safeName = sanitizeFileName(uploadedFile.name);
  const storageName = `${Date.now()}-${randomUUID()}-${safeName}`;
  const storagePath = path.join(FILE_UPLOADS_DIR, storageName);
  const relativePath = getRelativeUploadPath(storageName);
  const bytes = Buffer.from(await uploadedFile.arrayBuffer());

  await mkdir(FILE_UPLOADS_DIR, { recursive: true });
  await writeFile(storagePath, bytes);

  const file = await prisma.fileRecord.create({
    data: {
      clientId: optionalString(formData.get("clientId")),
      clientName: optionalString(formData.get("clientName")),
      projectId: optionalString(formData.get("projectId")),
      projectName: optionalString(formData.get("projectName")),
      name: optionalString(formData.get("name")) ?? safeName,
      originalName: uploadedFile.name,
      mimeType: uploadedFile.type || "application/octet-stream",
      type: normalizeFileType(optionalString(formData.get("type"))),
      size: formatFileSize(uploadedFile.size),
      sizeBytes: uploadedFile.size,
      storagePath,
      relativePath,
    },
  });

  return NextResponse.json({ ok: true, file }, { status: 201 });
}

async function createMetadataOnlyFileRecord(request: Request) {
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
      originalName: payload.originalName,
      mimeType: payload.mimeType,
      type: normalizeFileType(payload.type),
      size: payload.size,
      sizeBytes: payload.sizeBytes,
      storagePath: payload.storagePath,
      relativePath: payload.relativePath,
      uploadedAt: payload.uploadedAt ? new Date(payload.uploadedAt) : undefined,
    },
  });

  return NextResponse.json({ ok: true, file }, { status: 201 });
}

export async function POST(request: Request) {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      return await createMultipartFileRecord(request);
    }

    return await createMetadataOnlyFileRecord(request);
  } catch (error) {
    console.error("File POST error:", error);

    return NextResponse.json(
      { error: "Failed to create file." },
      { status: 500 }
    );
  }
}
