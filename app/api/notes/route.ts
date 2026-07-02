import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth/require-auth";

type CreateNotePayload = {
  clientId?: string;
  projectId?: string;
  title: string;
  body: string;
  type?: "General" | "Call" | "Decision" | "Reminder" | "Research";
};

export async function GET() {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }
  try {
    const notes = await prisma.note.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      notes,
    });
  } catch (error) {
    console.error("Note GET error:", error);

    return NextResponse.json(
      { error: "Failed to load notes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }
  try {
    const payload = (await request.json()) as CreateNotePayload;

    if (!payload.title || !payload.body) {
      return NextResponse.json(
        { error: "Missing required note fields." },
        { status: 400 }
      );
    }

    const note = await prisma.note.create({
      data: {
        clientId: payload.clientId,
        projectId: payload.projectId,
        title: payload.title,
        body: payload.body,
        type: payload.type ?? "General",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        note,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Note POST error:", error);

    return NextResponse.json(
      { error: "Failed to create note." },
      { status: 500 }
    );
  }
}
