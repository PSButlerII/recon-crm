import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SETTINGS_KEY = "default";

type UpdateSettingsPayload = {
  businessName?: string;
  defaultEmail?: string;
  defaultHourlyRate?: number;
  defaultCurrency?: string;
  paymentTerms?: string;
};

const defaultSettings = {
  key: SETTINGS_KEY,
  businessName: "Recon Dev LLC",
  defaultHourlyRate: 35,
  defaultCurrency: "USD",
  paymentTerms: "Due on receipt",
};

async function getOrCreateSettings() {
  return prisma.appSettings.upsert({
    where: {
      key: SETTINGS_KEY,
    },
    update: {},
    create: defaultSettings,
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

    await getOrCreateSettings();

    const settings = await prisma.appSettings.update({
      where: {
        key: SETTINGS_KEY,
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
      settings,
    });
  } catch (error) {
    console.error("Settings PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update settings." },
      { status: 500 }
    );
  }
}
