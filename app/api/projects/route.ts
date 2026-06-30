import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateProjectPayload = {
  clientId?: string;
  clientName: string;
  serviceRequestId?: string;
  name: string;
  description: string;
  status?: "Planning" | "Active" | "On Hold" | "Completed" | "Cancelled";
  priority?: "Low" | "Medium" | "High" | "Urgent";
  progress?: number;
  startDate?: string;
  dueDate?: string;
};

function buildProjectData(payload: CreateProjectPayload) {
  return {
    clientId: payload.clientId,
    clientName: payload.clientName,
    serviceRequestId: payload.serviceRequestId,
    name: payload.name,
    description: payload.description,
    status: payload.status ?? "Planning",
    priority: payload.priority ?? "Medium",
    progress: payload.progress ?? 0,
    startDate: payload.startDate ? new Date(payload.startDate) : null,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
  };
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      projects,
    });
  } catch (error) {
    console.error("Project GET error:", error);

    return NextResponse.json(
      { error: "Failed to load projects." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateProjectPayload;

    if (!payload.clientName || !payload.name || !payload.description) {
      return NextResponse.json(
        { error: "Missing required project fields." },
        { status: 400 }
      );
    }

    const projectData = buildProjectData(payload);

    if (payload.serviceRequestId) {
      const existingProject = await prisma.project.findFirst({
        where: {
          serviceRequestId: payload.serviceRequestId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (existingProject) {
        return NextResponse.json({
          ok: true,
          created: false,
          project: existingProject,
        });
      }

      const createResult = await prisma.project.createMany({
        data: projectData,
        skipDuplicates: true,
      });

      const project = await prisma.project.findFirst({
        where: {
          serviceRequestId: payload.serviceRequestId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Failed to load created project." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          ok: true,
          created: createResult.count === 1,
          project,
        },
        { status: createResult.count === 1 ? 201 : 200 }
      );
    }

    const project = await prisma.project.create({
      data: projectData,
    });

    return NextResponse.json(
      {
        ok: true,
        created: true,
        project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Project POST error:", error);

    return NextResponse.json(
      { error: "Failed to create project." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const { id, status, progress } = body as {
      id?: string;
      status?: "Planning" | "Active" | "On Hold" | "Completed" | "Cancelled";
      progress?: number;
    };

    if (!id) {
      return NextResponse.json(
        { error: "Missing project id." },
        { status: 400 }
      );
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(typeof progress === "number" ? { progress } : {}),
      },
    });

    return NextResponse.json({
      ok: true,
      project,
    });
  } catch (error) {
    console.error("Project PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update project." },
      { status: 500 }
    );
  }
}
