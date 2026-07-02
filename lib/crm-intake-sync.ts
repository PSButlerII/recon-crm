import { createHash, createHmac } from "crypto";

export type WebsiteInquiryPayload = {
  inquiryId?: string;
  source: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  projectType: string;
  goal: string;
  blocker?: string;
  budget?: string;
  timeline?: string;
  preferredContact?: string;
  message?: string;
  submittedAt?: string;
  priority?: "low" | "normal" | "high" | "urgent";
};

export function getStableInquiryId(payload: WebsiteInquiryPayload) {
  if (payload.inquiryId?.trim()) {
    return payload.inquiryId.trim();
  }

  const stableSource = [
    payload.source,
    payload.email.toLowerCase(),
    payload.phone,
    payload.projectType,
    payload.goal,
  ].join("|");
  const digest = createHash("sha256").update(stableSource).digest("hex");

  return `website-${digest.slice(0, 24)}`;
}

function getCrmIntakeConfig() {
  const url = process.env.CRM_INTAKE_URL;
  const apiKey = process.env.CRM_INTAKE_API_KEY;
  const signingSecret = process.env.CRM_SIGNING_SECRET;

  if (!url || !apiKey || !signingSecret) {
    return null;
  }

  return { url, apiKey, signingSecret };
}

function signBody(timestamp: string, rawBody: string, signingSecret: string) {
  return createHmac("sha256", signingSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
}

export async function syncInquiryToCrm(payload: WebsiteInquiryPayload) {
  const config = getCrmIntakeConfig();

  if (!config) {
    return { skipped: true } as const;
  }

  const crmPayload = {
    ...payload,
    inquiryId: getStableInquiryId(payload),
    submittedAt: payload.submittedAt ?? new Date().toISOString(),
    priority: payload.priority ?? "normal",
  };
  const body = JSON.stringify(crmPayload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signBody(timestamp, body, config.signingSecret);

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "X-Recon-Timestamp": timestamp,
        "X-Recon-Signature": signature,
      },
      body,
    });

    if (!response.ok) {
      console.error("CRM intake sync failed:", response.status, await response.text());
      return { skipped: false, ok: false } as const;
    }

    return { skipped: false, ok: true } as const;
  } catch (error) {
    console.error("CRM intake sync failed:", error);
    return { skipped: false, ok: false } as const;
  }
}
