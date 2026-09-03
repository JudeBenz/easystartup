import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getPostgres, isPostgresEnabled } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { signMobileToken } from "@/lib/mobile-auth";
import { mobileJson, mobileOptions } from "@/lib/mobile-http";
import type { UserRole } from "@/types/domain";

export const runtime = "nodejs";

export function OPTIONS() {
  return mobileOptions();
}

export async function POST(req: Request) {
  if (!isPostgresEnabled()) {
    return mobileJson({ error: "Accounts are not available." }, { status: 503 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return mobileJson({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) {
    return mobileJson({ error: "Email and password are required." }, { status: 400 });
  }

  const db = getPostgres()!;
  const row = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!row?.passwordHash) {
    return mobileJson({ error: "Those credentials do not match." }, { status: 401 });
  }
  const ok = await compare(password, row.passwordHash);
  if (!ok) {
    return mobileJson({ error: "Those credentials do not match." }, { status: 401 });
  }

  const roles = (Array.isArray(row.roles) ? row.roles : []) as UserRole[];
  const token = await signMobileToken({ id: row.id, email: row.email, roles });
  return mobileJson({
    token,
    user: { id: row.id, name: row.name, email: row.email, roles },
  });
}
