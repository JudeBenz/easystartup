import { NextResponse } from "next/server";
import { isPostgresEnabled } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET() {
  const checks = {
    ok: true,
    postgres: isPostgresEnabled(),
    auth: Boolean(process.env.AUTH_SECRET?.trim()),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    email: Boolean(process.env.RESEND_API_KEY?.trim()),
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(checks, { status: checks.ok ? 200 : 503 });
}
