import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateActivityPayload = {
  clientId?: string;
  projectId?: string;
  type: "Client" | "Project" | "Task" | "Note" | "System";
  message: string;
};

export async function GET() {
  try {
    const activity = await prisma.activityLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      activity,
    });
  } catch (error) {
    console.error("Activity GET error:", error);

    return NextResponse.json(
      { error: "Failed to load activity." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateActivityPayload;

    if (!payload.type || !payload.message) {
      return NextResponse.json(
        { error: "Missing required activity fields." },
        { status: 400 }
      );
    }

    const activity = await prisma.activityLog.create({
      data: {
        clientId: payload.clientId,
        projectId: payload.projectId,
        type: payload.type,
        message: payload.message,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        activity,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Activity POST error:", error);

    return NextResponse.json(
      { error: "Failed to create activity." },
      { status: 500 }
    );
  }
}