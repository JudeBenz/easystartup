/**
 * One-shot production bootstrap after DATABASE_URL is set.
 *
 * Usage:
 *   DATABASE_URL=... ADMIN_EMAIL=you@example.com pnpm --filter showshow exec tsx --env-file=.env.local scripts/bootstrap-prod.ts
 *
 * Or with only env already loaded:
 *   pnpm --filter showshow db:push && pnpm --filter showshow db:seed
 *   then run this script to grant admin.
 */
import { sql } from "drizzle-orm";
import { requirePostgres } from "../lib/db/client";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const db = requirePostgres();
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  const showCount = await db.execute(sql`select count(*)::int as n from shows`);
  console.log("Connected. Shows currently:", showCount[0]);

  if (!adminEmail) {
    console.log("Set ADMIN_EMAIL=you@example.com to grant admin role.");
    return;
  }

  const row = await db.query.users.findFirst({ where: eq(users.email, adminEmail) });
  if (!row) {
    console.error(`No user with email ${adminEmail}. Create an account on /settings first, then re-run.`);
    process.exit(1);
  }

  const roles = Array.isArray(row.roles) ? [...row.roles] : [];
  if (!roles.includes("admin")) {
    roles.push("admin");
    await db
      .update(users)
      .set({ roles, updatedAt: new Date() })
      .where(eq(users.id, row.id));
    console.log(`Granted admin to ${adminEmail}`);
  } else {
    console.log(`${adminEmail} already has admin`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
