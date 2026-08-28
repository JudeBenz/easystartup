import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { PageHeader, Panel } from "@/components/ui";
import { verifyDirectorAction } from "@/lib/actions-more";
import { requireAdmin } from "@/lib/auth/guards";
import { isPostgresEnabled, requirePostgres } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export const metadata = { title: "Admin · Directors" };

export default async function AdminDirectorsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/settings");
  }

  if (!isPostgresEnabled()) {
    return (
      <div>
        <PageHeader title="Director verification" description="Requires Postgres." />
      </div>
    );
  }

  const { pgListPendingDirectors } = await import("@/lib/store/pg-social");
  const pending = await pgListPendingDirectors();
  const db = requirePostgres();
  const userRows = pending.length
    ? await db.select().from(users).where(inArray(users.id, pending.map((d) => d.userId)))
    : [];

  return (
    <div>
      <PageHeader
        title="Director verification"
        description="Approve organizer claims that did not auto-verify by email domain."
      />
      <Panel>
        <ul className="space-y-4">
          {pending.map((d) => {
            const user = userRows.find((u) => u.id === d.userId);
            return (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
                <div>
                  <p className="font-bold">{user?.name ?? d.userId}</p>
                  <p className="text-sm text-[var(--muted)]">{user?.email}</p>
                  <p className="text-sm">Shows: {d.showIds.join(", ")}</p>
                </div>
                <form action={verifyDirectorAction}>
                  <input type="hidden" name="directorId" value={d.id} />
                  <button type="submit" className="ss-btn ss-btn-primary min-h-[var(--tap)]">
                    Verify
                  </button>
                </form>
              </li>
            );
          })}
          {!pending.length ? (
            <li className="text-[var(--muted)]">No pending director claims.</li>
          ) : null}
        </ul>
      </Panel>
    </div>
  );
}
