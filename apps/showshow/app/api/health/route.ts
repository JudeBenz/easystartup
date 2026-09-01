import { NextResponse } from "next/server";
import { isPostgresEnabled } from "@/lib/db/client";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  const allowed = Boolean(secret) && auth === `Bearer ${secret}`;

  if (!allowed) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({
    ok: true,
    postgres: isPostgresEnabled(),
    auth: Boolean(process.env.AUTH_SECRET?.trim()),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    email: Boolean(process.env.RESEND_API_KEY?.trim()),
    timestamp: new Date().toISOString(),
  });
}
