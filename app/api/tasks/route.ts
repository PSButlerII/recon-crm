import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth/require-auth";

type CreateTaskPayload = {
  projectId: string;
  projectName: string;
  clientId?: string;
  clientName?: string;
  title: string;
  description?: string;
  status?: "Todo" | "In Progress" | "Blocked" | "Done";
  priority?: "Low" | "Medium" | "High" | "Urgent";
  dueDate?: string;
};

export async function GET() {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      tasks,
    });
  } catch (error) {
    console.error("Task GET error:", error);

    return NextResponse.json(
      { error: "Failed to load tasks." },
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
    const payload = (await request.json()) as CreateTaskPayload;

    if (!payload.projectId || !payload.projectName || !payload.title) {
      return NextResponse.json(
        { error: "Missing required task fields." },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        projectId: payload.projectId,
        projectName: payload.projectName,
        clientId: payload.clientId,
        clientName: payload.clientName,
        title: payload.title,
        description: payload.description,
        status: payload.status ?? "Todo",
        priority: payload.priority ?? "Medium",
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        task,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Task POST error:", error);

    return NextResponse.json(
      { error: "Failed to create task." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }
  try {
    const body = await request.json();

    const { id, status } = body as {
      id?: string;
      status?: "Todo" | "In Progress" | "Blocked" | "Done";
    };

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing task id or status." },
        { status: 400 }
      );
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      ok: true,
      task,
    });
  } catch (error) {
    console.error("Task PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update task." },
      { status: 500 }
    );
  }
}
