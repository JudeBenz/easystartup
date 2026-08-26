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
        eyebrow="Artist tools"
        title="Cancellation & weather alerts"
        description="Rain-outs, permit issues, and show changes. Historical weather lives on each show page."
      />
      <div className="space-y-3">
        {rows.map(({ alert, show, edition }) => (
          <Panel key={alert.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Badge tone="warn">{alert.kind}</Badge>
                <h2 className="mt-2 font-[family-name:var(--font-syne)] text-lg font-bold">{alert.title}</h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">{alert.body}</p>
                <p className="mt-2 text-sm">
                  <Link href={`/shows/${show.slug}`} className="font-medium hover:text-[var(--field)]">
                    {show.name}
                  </Link>{" "}
                  · {formatDate(edition.startDate)}
                </p>
              </div>
              <p className="text-xs text-[var(--ink-soft)]">{formatDate(alert.createdAt)}</p>
            </div>
          </Panel>
        ))}
        {!rows.length ? (
          <Panel>
            <p className="text-sm text-[var(--ink-soft)]">No alerts right now.</p>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
