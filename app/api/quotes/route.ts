import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth/require-auth";

type CreateQuotePayload = {
  clientId?: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  title: string;
  status?: "Draft" | "Sent" | "Accepted" | "Declined";
  amount?: number;
  issuedDate?: string | null;
  validUntil?: string;
};

export async function GET() {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }
  try {
    const quotes = await prisma.quote.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      quotes,
    });
  } catch (error) {
    console.error("Quote GET error:", error);

    return NextResponse.json(
      { error: "Failed to load quotes." },
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
    const payload = (await request.json()) as CreateQuotePayload;

    if (!payload.clientName || !payload.title) {
      return NextResponse.json(
        { error: "Missing required quote fields." },
        { status: 400 }
      );
    }

    const quote = await prisma.quote.create({
      data: {
        clientId: payload.clientId,
        clientName: payload.clientName,
        projectId: payload.projectId,
        projectName: payload.projectName,
        title: payload.title,
        status: payload.status ?? "Draft",
        amount: payload.amount ?? 0,
        issuedDate: payload.issuedDate ? new Date(payload.issuedDate) : null,
        validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        quote,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Quote POST error:", error);

    return NextResponse.json(
      { error: "Failed to create quote." },
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

    const { id, status, issuedDate  } = body as {
      id?: string;
      status?: "Draft" | "Sent" | "Accepted" | "Declined";
      issuedDate?: string | null;
    };

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing quote id or status." },
        { status: 400 }
      );
    }

    const quote = await prisma.quote.update({
    where: { id },
    data: {
        ...(status ? { status } : {}),
        ...(issuedDate !== undefined
        ? { issuedDate: issuedDate ? new Date(issuedDate) : null }
        : {}),
        },
    });

    return NextResponse.json({
      ok: true,
      quote,
    });
  } catch (error) {
    console.error("Quote PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update quote." },
      { status: 500 }
    );
  }
}
