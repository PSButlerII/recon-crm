import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ServiceRequestStatus } from "@/types/service-request";
import { requireApiAuth } from "@/lib/auth/require-auth";

type CreateServiceRequestPayload = {
  intakeSubmissionId?: string;
  clientId?: string;
  clientName?: string;
  title: string;
  description: string;
  category: string;
  status?: ServiceRequestStatus;
  requestedAt: string;
};

const SERVICE_REQUEST_STATUSES: ServiceRequestStatus[] = [
  "New",
  "Reviewing",
  "Quoted",
  "Approved",
  "Declined",
  "Converted",
];

function isServiceRequestStatus(value: unknown): value is ServiceRequestStatus {
  return (
    typeof value === "string" &&
    SERVICE_REQUEST_STATUSES.includes(value as ServiceRequestStatus)
  );
}

function optionalString(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

export async function GET() {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }
  try {
    const serviceRequests = await prisma.serviceRequest.findMany({
      orderBy: {
        requestedAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      serviceRequests,
    });
  } catch (error) {
    console.error("Service Request GET error:", error);

    return NextResponse.json(
      { error: "Failed to load service requests." },
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
    const payload = (await request.json()) as CreateServiceRequestPayload;
    const intakeSubmissionId = optionalString(payload.intakeSubmissionId);
    const requestedAt = new Date(payload.requestedAt);

    if (
      !payload.title ||
      !payload.description ||
      !payload.category ||
      !payload.requestedAt
    ) {
      return NextResponse.json(
        { error: "Missing required service request fields." },
        { status: 400 }
      );
    }

    if (Number.isNaN(requestedAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid requestedAt date." },
        { status: 400 }
      );
    }

    const data = {
      intakeSubmissionId,
      clientId: optionalString(payload.clientId),
      clientName: optionalString(payload.clientName),
      title: payload.title,
      description: payload.description,
      category: payload.category,
      status: isServiceRequestStatus(payload.status) ? payload.status : "New",
      requestedAt,
    };

    if (intakeSubmissionId) {
      const existing = await prisma.serviceRequest.findFirst({
        where: {
          intakeSubmissionId,
        },
      });

      if (existing) {
        return NextResponse.json({
          ok: true,
          duplicate: true,
          serviceRequest: existing,
        });
      }

      const createResult = await prisma.serviceRequest.createMany({
        data,
        skipDuplicates: true,
      });

      const serviceRequest = await prisma.serviceRequest.findFirst({
        where: {
          intakeSubmissionId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!serviceRequest) {
        throw new Error("Service request creation failed.");
      }

      return NextResponse.json(
        {
          ok: true,
          duplicate: createResult.count === 0,
          serviceRequest,
        },
        { status: createResult.count === 1 ? 201 : 200 }
      );
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        title: payload.title,
        description: payload.description,
        category: payload.category,
        status: data.status,
        requestedAt,
        clientId: data.clientId,
        clientName: data.clientName,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        duplicate: false,
        serviceRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Service Request POST error:", error);

    return NextResponse.json(
      { error: "Failed to create service request." },
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
      status?: ServiceRequestStatus;
    };

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing id or status." },
        { status: 400 }
      );
    }

    const serviceRequest = await prisma.serviceRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      ok: true,
      serviceRequest,
    });
  } catch (error) {
    console.error("Service Request PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update service request." },
      { status: 500 }
    );
  }
}
