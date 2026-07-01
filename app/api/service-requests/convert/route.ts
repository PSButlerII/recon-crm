import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ProjectPriority } from "@/types/project";
import { requireApiAuth } from "@/lib/auth/require-auth";

const PROJECT_PRIORITIES: ProjectPriority[] = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];


type ServiceRequestConversionTransaction = Pick<
  typeof prisma,
  "serviceRequest" | "project" | "activityLog"
>;

type ConvertServiceRequestPayload = {
  id?: string;
  priority?: ProjectPriority;
  dueDate?: string | null;
};

type ConversionActivity = {
  id: string;
  clientId: string | null;
  projectId: string | null;
  type: string;
  message: string;
  createdAt: Date;
};

function isProjectPriority(value: unknown): value is ProjectPriority {
  return (
    typeof value === "string" &&
    PROJECT_PRIORITIES.includes(value as ProjectPriority)
  );
}

function parseOptionalDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

export async function POST(request: Request) {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }
  try {
    const payload = (await request.json()) as ConvertServiceRequestPayload;

    if (!payload.id) {
      return NextResponse.json(
        { error: "Missing service request id." },
        { status: 400 }
      );
    }

    const serviceRequestId = payload.id;
    const dueDate = parseOptionalDate(payload.dueDate);

    if (typeof dueDate === "undefined") {
      return NextResponse.json(
        { error: "Invalid project due date." },
        { status: 400 }
      );
    }

    const priority = isProjectPriority(payload.priority)
      ? payload.priority
      : "Medium";

    const startDate = new Date();

    const result = await prisma.$transaction(
      async (tx: ServiceRequestConversionTransaction) => {
        const serviceRequest = await tx.serviceRequest.findUnique({
        where: {
          id: serviceRequestId,
        },
      });

      if (!serviceRequest) {
        return null;
      }

      let project = await tx.project.findFirst({
        where: {
          serviceRequestId: serviceRequest.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      let createdProject = false;
      let activity: ConversionActivity | null = null;

      if (!project) {
        const createResult = await tx.project.createMany({
          data: {
            clientId: serviceRequest.clientId,
            clientName: serviceRequest.clientName ?? "Unassigned",
            serviceRequestId: serviceRequest.id,
            name: serviceRequest.title,
            description: serviceRequest.description,
            status: "Planning",
            priority,
            progress: 0,
            startDate,
            dueDate,
          },
          skipDuplicates: true,
        });

        createdProject = createResult.count === 1;

        project = await tx.project.findFirst({
          where: {
            serviceRequestId: serviceRequest.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (!project) {
          throw new Error("Project conversion failed.");
        }

        if (createdProject) {
          activity = await tx.activityLog.create({
            data: {
              clientId: project.clientId,
              projectId: project.id,
              type: "Project",
              message: `Created project "${project.name}" from service request.`,
            },
          });
        }
      }

      const convertedRequest =
        serviceRequest.status === "Converted"
          ? serviceRequest
          : await tx.serviceRequest.update({
              where: {
                id: serviceRequest.id,
              },
              data: {
                status: "Converted",
              },
            });

      return {
        project,
        serviceRequest: convertedRequest,
        activity,
        createdProject,
        createdActivity: Boolean(activity),
      };
    });

    if (!result) {
      return NextResponse.json(
        { error: "Service request not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        createdProject: result.createdProject,
        createdActivity: result.createdActivity,
        project: result.project,
        serviceRequest: result.serviceRequest,
        activity: result.activity,
      },
      { status: result.createdProject ? 201 : 200 }
    );
  } catch (error) {
    console.error("Service Request conversion error:", error);

    return NextResponse.json(
      { error: "Failed to convert service request." },
      { status: 500 }
    );
  }
}
