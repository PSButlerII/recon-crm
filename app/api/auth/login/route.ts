import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { isAuthConfigured, setSessionCookie } from "@/lib/auth/session";

type LoginPayload = {
  password?: string;
};

export async function POST(request: Request) {
  const { password } = (await request.json()) as LoginPayload;
  const passwordHash = process.env.CRM_AUTH_PASSWORD_HASH;

  if (!isAuthConfigured() || !passwordHash) {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 500 }
    );
  }

  if (!password || !verifyPassword(password, passwordHash)) {
    return NextResponse.json(
      { error: "Invalid password." },
      { status: 401 }
    );
  }

  await setSessionCookie();

  return NextResponse.json({ ok: true });
}
