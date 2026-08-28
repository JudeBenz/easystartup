import { NextRequest, NextResponse } from "next/server";
import { isPostgresEnabled } from "@/lib/db/client";
import { runDeadlineReminders } from "@/lib/jobs/deadline-reminders";

export const runtime = "nodejs";

/** Vercel Cron / external scheduler. Auth: Bearer CRON_SECRET */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresEnabled()) {
    return NextResponse.json({ error: "Postgres required" }, { status: 503 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
  const result = await runDeadlineReminders({ dryRun });
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
