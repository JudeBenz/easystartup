import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { listEditionsForCalendar } from "@/lib/store";

export const metadata = { title: "Show calendar" };

export default async function ShowsCalendarPage() {
  const rows = await listEditionsForCalendar();
  const byMonth = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.edition.startDate.slice(0, 7);
    const list = byMonth.get(key) ?? [];
    list.push(row);
    byMonth.set(key, list);
  }
  const months = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const deadlines = rows
    .filter((r) => r.edition.applicationDeadline)
    .map((r) => ({
      ...r,
      deadline: r.edition.applicationDeadline!,
    }))
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  return (
    <div>
      <PageHeader
        eyebrow="Discovery"
        title="Calendar"
        description="Show dates and application deadlines as separate layers — never confuse load-in with jury day."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">Show dates</h2>
          <div className="mt-4 space-y-5">
            {months.map(([month, list]) => (
              <div key={month}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--field-bright)]">
                  {formatDate(`${month}-01`, "MMMM yyyy")}
                </p>
                <ul className="mt-2 space-y-2">
                  {list
                    .sort((a, b) => a.edition.startDate.localeCompare(b.edition.startDate))
                    .map(({ show, edition }) => (
                      <li key={edition.id}>
                        <Link href={`/shows/${show.slug}`} className="flex justify-between gap-3 text-sm hover:text-[var(--field)]">
                          <span className="font-medium">{show.name}</span>
                          <span className="shrink-0 text-[var(--ink-soft)]">
                            {formatDate(edition.startDate, "MMM d")}–{formatDate(edition.endDate, "d")}
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">Application deadlines</h2>
          <ul className="mt-4 space-y-2">
            {deadlines.map(({ show, edition, deadline }) => (
              <li key={edition.id} className="flex items-center justify-between gap-3 text-sm">
                <Link href={`/shows/${show.slug}`} className="font-medium hover:text-[var(--field)]">
                  {show.name}
                </Link>
                <Badge tone="signal">{formatDate(deadline)}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
