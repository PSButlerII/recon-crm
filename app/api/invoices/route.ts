import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateInvoicePayload = {
  quoteId?: string;
  clientId?: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  title: string;
  status?: "Draft" | "Sent" | "Paid" | "Overdue";
  amount?: number;
  issuedDate?: string | null;
  dueDate?: string | null;
  paidDate?: string | null;
};

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      invoices,
    });
  } catch (error) {
    console.error("Invoice GET error:", error);

    return NextResponse.json(
      { error: "Failed to load invoices." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateInvoicePayload;

    if (!payload.clientName || !payload.title) {
      return NextResponse.json(
        { error: "Missing required invoice fields." },
        { status: 400 }
      );
    }
        if (payload.quoteId) {
        const existingInvoice = await prisma.invoice.findUnique({
            where: {
            quoteId: payload.quoteId,
            },
        });

        if (existingInvoice) {
            return NextResponse.json(
            {
                ok: true,
                duplicate: true,
                invoice: existingInvoice,
            },
            { status: 200 }
            );
        }
        }
    const invoice = await prisma.invoice.create({
      data: {
        quoteId: payload.quoteId,
        clientId: payload.clientId,
        clientName: payload.clientName,
        projectId: payload.projectId,
        projectName: payload.projectName,
        title: payload.title,
        status: payload.status ?? "Draft",
        amount: payload.amount ?? 0,
        issuedDate: payload.issuedDate ? new Date(payload.issuedDate) : null,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        paidDate: payload.paidDate ? new Date(payload.paidDate) : null,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        invoice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invoice POST error:", error);

    return NextResponse.json(
      { error: "Failed to create invoice." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const { id, status, issuedDate, dueDate, paidDate } = body as {
      id?: string;
      status?: "Draft" | "Sent" | "Paid" | "Overdue";
      issuedDate?: string | null;
      dueDate?: string | null;
      paidDate?: string | null;
    };

    if (!id) {
      return NextResponse.json(
        { error: "Missing invoice id." },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(issuedDate !== undefined
          ? { issuedDate: issuedDate ? new Date(issuedDate) : null }
          : {}),
        ...(dueDate !== undefined
          ? { dueDate: dueDate ? new Date(dueDate) : null }
          : {}),
        ...(paidDate !== undefined
          ? { paidDate: paidDate ? new Date(paidDate) : null }
          : {}),
      },
    });

    return NextResponse.json({
      ok: true,
      invoice,
    });
  } catch (error) {
    console.error("Invoice PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update invoice." },
      { status: 500 }
    );
  }
}