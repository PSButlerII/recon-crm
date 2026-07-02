import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { hasValidSession, isAuthConfigured } from "@/lib/auth/session";

export async function requirePageAuth() {
  if (!isAuthConfigured() || !(await hasValidSession())) {
    redirect("/login");
  }
}

export async function requireApiAuth() {
  if (isAuthConfigured() && (await hasValidSession())) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
