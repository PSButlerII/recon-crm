import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateServiceRequestPayload = {
  intakeSubmissionId?: string;
  clientId?: string;
  clientName?: string;
  title: string;
  description: string;
  category: string;
  status?: "New" | "Reviewing" | "Quoted" | "Approved" | "Declined" | "Converted";
  requestedAt: string;
};

export async function GET() {
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
  try {
    const payload = (await request.json()) as CreateServiceRequestPayload;

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

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        intakeSubmissionId: payload.intakeSubmissionId,
        clientId: payload.clientId,
        clientName: payload.clientName,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        status: payload.status ?? "New",
        requestedAt: new Date(payload.requestedAt),
      },
    });

    return NextResponse.json(
      {
        ok: true,
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
  try {
    const body = await request.json();

    const { id, status } = body as {
      id?: string;
      status?: "New" | "Reviewing" | "Quoted" | "Approved" | "Declined" | "Converted";
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