import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const DEFAULT_COOKIE_NAME = "recon_crm_session";
const DEFAULT_TTL_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  exp: number;
};

function getSessionSecret() {
  return process.env.CRM_SESSION_SECRET ?? "";
}

export function getSessionCookieName() {
  return process.env.CRM_SESSION_COOKIE_NAME || DEFAULT_COOKIE_NAME;
}

export function getSessionTtlSeconds() {
  const ttl = Number(process.env.CRM_SESSION_TTL_SECONDS);

  if (!Number.isFinite(ttl) || ttl <= 0) {
    return DEFAULT_TTL_SECONDS;
  }

  return Math.floor(ttl);
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAuthConfigured() {
  return Boolean(process.env.CRM_AUTH_PASSWORD_HASH && getSessionSecret());
}

export function createSessionToken() {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + getSessionTtlSeconds(),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token?: string) {
  if (!token || !isAuthConfigured()) {
    return false;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = signPayload(encodedPayload);

  if (!safeCompare(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;

    return typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function hasValidSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  return verifySessionToken(token);
}

export async function setSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(getSessionCookieName(), createSessionToken(), {
    httpOnly: true,
    maxAge: getSessionTtlSeconds(),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(getSessionCookieName());
}
