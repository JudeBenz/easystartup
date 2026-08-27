import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { listAlerts } from "@/lib/store";

export const metadata = { title: "Alerts" };

export default async function AlertsPage() {
  const rows = await listAlerts();

  return (
    <div>
      <PageHeader
        title="Cancellation & weather alerts"
        description="Rain-outs, permit issues, and show changes. Historical weather lives on each show page."
      />
      <div className="space-y-3">
        {rows.map(({ alert, show, edition }) => (
          <Panel key={alert.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Badge tone="warn">{alert.kind}</Badge>
                <h2 className="mt-2 font-display text-lg font-bold">{alert.title}</h2>
                <p className="mt-1 text-[1.05rem] text-[var(--muted)]">{alert.body}</p>
                <p className="mt-2 text-[1.05rem]">
                  <Link href={`/shows/${show.slug}`} className="font-medium hover:text-[var(--field)]">
                    {show.name}
                  </Link>{" "}
                  · {formatDate(edition.startDate)}
                </p>
              </div>
              <p className="text-base text-[var(--muted)]">{formatDate(alert.createdAt)}</p>
            </div>
          </Panel>
        ))}
        {!rows.length ? (
          <Panel>
            <p className="text-[1.05rem] text-[var(--muted)]">No alerts right now.</p>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
