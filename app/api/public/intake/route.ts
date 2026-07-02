import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const MAX_BODY_BYTES = 32 * 1024;
const REPLAY_WINDOW_SECONDS = 5 * 60;

const intakeSchema = z.object({
  inquiryId: z.string().trim().min(1).max(120),
  source: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(160),
  email: z.email().max(255),
  phone: z.string().trim().min(1).max(80),
  company: z.string().trim().max(160).optional(),
  projectType: z.string().trim().min(1).max(120),
  goal: z.string().trim().min(1).max(2000),
  blocker: z.string().trim().max(1000).optional(),
  budget: z.string().trim().max(120).optional(),
  timeline: z.string().trim().max(120).optional(),
  preferredContact: z.string().trim().max(120).optional(),
  message: z.string().trim().max(4000).optional(),
  submittedAt: z.iso.datetime().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

type IntakePayload = z.infer<typeof intakeSchema>;

function safeJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function validateApiKey(request: Request) {
  const expectedApiKey = process.env.CRM_INTAKE_API_KEY;
  const providedApiKey = getBearerToken(request);

  return Boolean(
    expectedApiKey && providedApiKey && safeCompare(providedApiKey, expectedApiKey)
  );
}

function validateTimestamp(timestampHeader: string | null) {
  if (!timestampHeader) {
    return false;
  }

  const timestamp = Number(timestampHeader);

  if (!Number.isInteger(timestamp)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);

  return Math.abs(now - timestamp) <= REPLAY_WINDOW_SECONDS;
}

function signBody(timestamp: string, rawBody: string, signingSecret: string) {
  return createHmac("sha256", signingSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
}

function validateSignature(request: Request, rawBody: string) {
  const signingSecret = process.env.CRM_SIGNING_SECRET;
  const timestamp = request.headers.get("x-recon-timestamp");
  const signature = request.headers.get("x-recon-signature") ?? "";

  if (!signingSecret || !timestamp || !signature) {
    return false;
  }

  if (!validateTimestamp(timestamp)) {
    return false;
  }

  const expectedSignature = signBody(timestamp, rawBody, signingSecret);

  return safeCompare(signature, expectedSignature);
}

function normalizeOptional(value?: string) {
  return value?.trim() || undefined;
}

function toCreateData(payload: IntakePayload) {
  return {
    inquiryId: payload.inquiryId,
    source: payload.source,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    company: normalizeOptional(payload.company),
    projectType: payload.projectType,
    goal: payload.goal,
    blocker: normalizeOptional(payload.blocker),
    budget: normalizeOptional(payload.budget),
    timeline: normalizeOptional(payload.timeline),
    preferredContact: normalizeOptional(payload.preferredContact),
    message: normalizeOptional(payload.message),
    submittedAt: payload.submittedAt ? new Date(payload.submittedAt) : new Date(),
    status: "New",
    priority: payload.priority ?? "normal",
  };
}

export async function POST(request: Request) {
  try {
    if (!process.env.CRM_INTAKE_API_KEY || !process.env.CRM_SIGNING_SECRET) {
      return safeJson({ error: "Public intake is not configured." }, 503);
    }

    if (!validateApiKey(request)) {
      return safeJson({ error: "Unauthorized" }, 401);
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);

    if (contentLength > MAX_BODY_BYTES) {
      return safeJson({ error: "Payload too large." }, 413);
    }

    const rawBody = await request.text();

    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return safeJson({ error: "Payload too large." }, 413);
    }

    if (!validateSignature(request, rawBody)) {
      return safeJson({ error: "Invalid signature." }, 401);
    }

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(rawBody) as unknown;
    } catch {
      return safeJson({ error: "Invalid JSON payload." }, 400);
    }

    const validation = intakeSchema.safeParse(parsedJson);

    if (!validation.success) {
      return safeJson({ error: "Invalid intake payload." }, 400);
    }

    const existing = await prisma.intakeSubmission.findUnique({
      where: {
        inquiryId: validation.data.inquiryId,
      },
    });

    if (existing) {
      return safeJson({ ok: true, duplicate: true, intakeId: existing.id });
    }

    const intake = await prisma.intakeSubmission.create({
      data: toCreateData(validation.data),
    });

    return safeJson(
      {
        ok: true,
        duplicate: false,
        intakeId: intake.id,
      },
      201
    );
  } catch (error) {
    console.error("Public intake error:", error);

    return safeJson({ error: "Failed to process intake submission." }, 500);
  }
}
