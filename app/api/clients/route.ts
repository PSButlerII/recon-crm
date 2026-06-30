import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ClientStatus } from "@/types/client";

const CLIENT_STATUSES: ClientStatus[] = [
  "Lead",
  "Active",
  "Paused",
  "Archived",
];

type CreateClientPayload = {
  name: string;
  contactName: string;
  email: string;
  phone?: string;
  status?: ClientStatus;
  projectCount?: number;
  lastContacted?: string;
};

type UpdateClientPayload = {
  id?: string;
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string | null;
  status?: ClientStatus;
  projectCount?: number;
  lastContacted?: string | null;
};

function isClientStatus(value: unknown): value is ClientStatus {
  return (
    typeof value === "string" && CLIENT_STATUSES.includes(value as ClientStatus)
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

    if (payload.status && !isClientStatus(payload.status)) {
      return NextResponse.json(
        { error: "Invalid client status." },
        { status: 400 }
      );
    }

    const lastContacted = parseOptionalDate(payload.lastContacted);

    if (typeof lastContacted === "undefined") {
      return NextResponse.json(
        { error: "Invalid last contacted date." },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name: payload.name,
        contactName: payload.contactName,
        email: payload.email,
        phone: payload.phone || null,
        status: payload.status ?? "Lead",
        projectCount: payload.projectCount ?? 0,
        lastContacted,
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

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as UpdateClientPayload;

    if (!payload.id) {
      return NextResponse.json(
        { error: "Missing client id." },
        { status: 400 }
      );
    }

    if (payload.status && !isClientStatus(payload.status)) {
      return NextResponse.json(
        { error: "Invalid client status." },
        { status: 400 }
      );
    }

    const lastContacted = parseOptionalDate(payload.lastContacted);

    if (typeof lastContacted === "undefined") {
      return NextResponse.json(
        { error: "Invalid last contacted date." },
        { status: 400 }
      );
    }

    const data: {
      name?: string;
      contactName?: string;
      email?: string;
      phone?: string | null;
      status?: ClientStatus;
      projectCount?: number;
      lastContacted?: Date | null;
    } = {};

    if (typeof payload.name === "string") {
      data.name = payload.name;
    }

    if (typeof payload.contactName === "string") {
      data.contactName = payload.contactName;
    }

    if (typeof payload.email === "string") {
      data.email = payload.email;
    }

    if ("phone" in payload) {
      data.phone = payload.phone || null;
    }

    if (payload.status) {
      data.status = payload.status;
    }

    if (typeof payload.projectCount === "number") {
      data.projectCount = payload.projectCount;
    }

    if ("lastContacted" in payload) {
      data.lastContacted = lastContacted;
    }

    const client = await prisma.client.update({
      where: {
        id: payload.id,
      },
      data,
    });

    return NextResponse.json({
      ok: true,
      client,
    });
  } catch (error) {
    console.error("Client PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update client." },
      { status: 500 }
    );
  }
}
