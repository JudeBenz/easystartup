import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getSessionArtistId } from "@/lib/session-data";
import { listAlerts } from "@/lib/store";

export const metadata = { title: "Alerts" };

export default async function AlertsPage() {
  const artistId = await getSessionArtistId();
  const rows = await listAlerts(artistId);
  const deadlines = rows.filter((r) => r.kind === "deadline");
  const operational = rows.filter((r) => r.kind === "operational");

  return (
    <div>
      <PageHeader
        title="Alerts & deadlines"
        description="Application deadlines from your tracker, plus rain-outs, permit issues, and show changes."
      />

      {deadlines.length ? (
        <section className="mb-8">
          <h2 className="mb-3 font-display text-[1.5rem]">Your deadlines</h2>
          <div className="space-y-3">
            {deadlines.map((row) => (
              <Panel key={row.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Badge tone="warn">deadline</Badge>
                    <h3 className="mt-2 font-display text-lg font-bold">{row.title}</h3>
                    <p className="mt-1 text-[1.05rem] text-[var(--muted)]">{row.body}</p>
                    <p className="mt-2 text-sm">
                      <Link href={row.href} className="font-medium hover:text-[var(--field)]">
                        Open tracker
                      </Link>
                      {" · "}
                      <Link
                        href={`/shows/${row.show.slug}`}
                        className="font-medium hover:text-[var(--field)]"
                      >
                        {row.show.name}
                      </Link>
                    </p>
                  </div>
                  {row.dueAt ? (
                    <p className="text-base font-bold text-[var(--accent-deep)]">
                      {formatDate(row.dueAt)}
                    </p>
                  ) : null}
                </div>
              </Panel>
            ))}
          </div>
        </section>
      ) : artistId ? (
        <Panel className="mb-8">
          <p className="text-[1.05rem] text-[var(--muted)]">
            No upcoming deadlines in your application tracker. Add shows on{" "}
            <Link href="/applications">Applications</Link>.
          </p>
        </Panel>
      ) : (
        <Panel className="mb-8">
          <p className="text-[1.05rem] text-[var(--muted)]">
            Switch to an artist persona to see personal deadline reminders.
          </p>
        </Panel>
      )}

      <section>
        <h2 className="mb-3 font-display text-[1.5rem]">Show changes</h2>
        <div className="space-y-3">
          {operational.map((row) => (
            <Panel key={row.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Badge tone="warn">{row.alertKind}</Badge>
                  <h3 className="mt-2 font-display text-lg font-bold">{row.title}</h3>
                  <p className="mt-1 text-[1.05rem] text-[var(--muted)]">{row.body}</p>
                  <p className="mt-2 text-sm">
                    <Link
                      href={`/shows/${row.show.slug}`}
                      className="font-medium hover:text-[var(--field)]"
                    >
                      {row.show.name}
                    </Link>{" "}
                    · {formatDate(row.edition.startDate)}
                  </p>
                </div>
                <p className="text-base text-[var(--muted)]">{formatDate(row.createdAt)}</p>
              </div>
            </Panel>
          ))}
          {!operational.length ? (
            <Panel>
              <p className="text-[1.05rem] text-[var(--muted)]">No operational alerts right now.</p>
            </Panel>
          ) : null}
        </div>
      </section>
    </div>
  );
}
