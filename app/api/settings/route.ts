import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type UpdateSettingsPayload = {
  businessName?: string;
  defaultEmail?: string;
  defaultHourlyRate?: number;
  defaultCurrency?: string;
  paymentTerms?: string;
};

async function getOrCreateSettings() {
  const existing = await prisma.appSettings.findFirst();

  if (existing) return existing;

  return prisma.appSettings.create({
    data: {
      businessName: "Recon Dev LLC",
      defaultHourlyRate: 35,
      defaultCurrency: "USD",
      paymentTerms: "Due on receipt",
    },
  });
}

export async function GET() {
  try {
    const settings = await getOrCreateSettings();

    return NextResponse.json({
      ok: true,
      settings,
    });
  } catch (error) {
    console.error("Settings GET error:", error);

    return NextResponse.json(
      { error: "Failed to load settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as UpdateSettingsPayload;

    const settings = await getOrCreateSettings();

    const updated = await prisma.appSettings.update({
      where: {
        id: settings.id,
      },
      data: {
        ...(payload.businessName !== undefined && {
          businessName: payload.businessName,
        }),
        ...(payload.defaultEmail !== undefined && {
          defaultEmail: payload.defaultEmail,
        }),
        ...(payload.defaultHourlyRate !== undefined && {
          defaultHourlyRate: payload.defaultHourlyRate,
        }),
        ...(payload.defaultCurrency !== undefined && {
          defaultCurrency: payload.defaultCurrency,
        }),
        ...(payload.paymentTerms !== undefined && {
          paymentTerms: payload.paymentTerms,
        }),
      },
    });

    return NextResponse.json({
      ok: true,
      settings: updated,
    });
  } catch (error) {
    console.error("Settings PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update settings." },
      { status: 500 }
    );
  }
}