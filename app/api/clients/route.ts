import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateClientPayload = {
  name: string;
  contactName: string;
  email: string;
  phone?: string;
  status?: "Lead" | "Active" | "Paused" | "Archived";
  projectCount?: number;
  lastContacted?: string;
};

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      clients,
    });
  } catch (error) {
    console.error("Client GET error:", error);

    return NextResponse.json(
      { error: "Failed to load clients." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateClientPayload;

    if (!payload.name || !payload.contactName || !payload.email) {
      return NextResponse.json(
        { error: "Missing required client fields." },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name: payload.name,
        contactName: payload.contactName,
        email: payload.email,
        phone: payload.phone,
        status: payload.status ?? "Lead",
        projectCount: payload.projectCount ?? 0,
        lastContacted: payload.lastContacted
          ? new Date(payload.lastContacted)
          : null,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        client,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Client POST error:", error);

    return NextResponse.json(
      { error: "Failed to create client." },
      { status: 500 }
    );
  }
}