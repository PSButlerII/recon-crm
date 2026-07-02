import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { getStableInquiryId, syncInquiryToCrm } from "@/lib/crm-intake-sync";

type WebsiteInquiryPayload = {
  inquiryId?: string;
  source: string;
  name: string;
  email: string;
  phone:string;
  company?: string;
  projectType: string;
  goal: string;
  blocker?: string;
  budget?: string;
  timeline?: string;
  preferredContact?: string;
  message?: string;
  submittedAt: string;
  status: "new";
  priority: "normal";
};

export async function POST(request: Request) {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }
  try {
    const payload = (await request.json()) as WebsiteInquiryPayload;

    if (
      !payload.source ||
      !payload.name ||
      !payload.email ||
      !payload.phone||
      !payload.projectType ||
      !payload.goal ||
      !payload.submittedAt
    ) {
      return NextResponse.json(
        { error: "Missing required intake fields." },
        { status: 400 }
      );
    }

    const inquiryId = getStableInquiryId(payload);

    const existing = await prisma.intakeSubmission.findUnique({
      where: {
        inquiryId,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          ok: true,
          duplicate: true,
          intakeId: existing.id,
        },
        { status: 200 }
      );
    }

    const intake = await prisma.intakeSubmission.create({
      data: {
        inquiryId,
        source: payload.source,
        name: payload.name,
        email: payload.email,
        phone:payload.phone,
        company: payload.company,
        projectType: payload.projectType,
        goal: payload.goal,
        blocker: payload.blocker,
        budget: payload.budget,
        timeline: payload.timeline,
        preferredContact: payload.preferredContact,
        message: payload.message,
        submittedAt: new Date(payload.submittedAt),
        status: "New",
        priority: payload.priority ?? "normal",
      },
    });

    await syncInquiryToCrm({
      ...payload,
      inquiryId,
      submittedAt: intake.submittedAt.toISOString(),
      priority: payload.priority ?? "normal",
    });

    return NextResponse.json(
      {
        ok: true,
        duplicate: false,
        intakeId: intake.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Intake API error:", error);

    return NextResponse.json(
      { error: "Failed to process intake submission." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }
  try {
    const submissions = await prisma.intakeSubmission.findMany({
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      submissions,
    });
  } catch (error) {
    console.error("Intake GET error:", error);

    return NextResponse.json(
      { error: "Failed to load intake submissions." },
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
      status?: "New" | "Reviewed" | "Converted" | "Ignored";
    };

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing id or status." },
        { status: 400 }
      );
    }

    const updated = await prisma.intakeSubmission.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      ok: true,
      submission: updated,
    });
  } catch (error) {
    console.error("Intake PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update intake submission." },
      { status: 500 }
    );
  }
}
