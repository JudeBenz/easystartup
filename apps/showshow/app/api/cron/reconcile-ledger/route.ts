import { NextRequest, NextResponse } from "next/server";
import { isPostgresEnabled } from "@/lib/db/client";
import { listStalePendingLedger } from "@/lib/payments/ledger";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresEnabled()) {
    return NextResponse.json({ error: "Postgres required" }, { status: 503 });
  }
  const stale = await listStalePendingLedger(24);
  return NextResponse.json({ ok: true, staleCount: stale.length, stale });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
