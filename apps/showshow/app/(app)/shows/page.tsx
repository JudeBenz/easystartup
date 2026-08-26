import Link from "next/link";
import { PageHeader, Panel, Badge, SelfReportedNote } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import { listShows } from "@/lib/store";

export const metadata = { title: "Shows" };

export default async function ShowsPage() {
  const rows = await listShows();
  const current = rows.filter((r) => r.current?.year === 2026);

  return (
    <div>
      <PageHeader
        eyebrow="Directory"
        title="Art fair directory"
        description="Raw facts from each show's official site — dates, fees, addresses, directors. No scraped rankings."
        actions={
          <>
            <Link className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm text-white" href="/shows/calendar">
              Calendar
            </Link>
            <Link className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm" href="/shows/map">
              Map
            </Link>
            <Link className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm" href="/shows/ranked">
              Our rankings
            </Link>
          </>
        }
      />
      <div className="grid gap-3">
        {current.map(({ show, current: edition, aggregate, promoted }) => (
          <Panel key={show.id} className="!p-0 overflow-hidden transition hover:-translate-y-0.5">
            <Link href={`/shows/${show.slug}`} className="block p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">{show.name}</h2>
                    {promoted ? <Badge tone="signal">Promoted</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {show.primaryCity}, {show.primaryRegion}
                    {edition ? ` · ${formatDate(edition.startDate)} – ${formatDate(edition.endDate)}` : null}
                  </p>
                </div>
                <div className="text-right text-sm">
                  {edition?.boothFeeMin != null ? (
                    <p className="font-medium">
                      Booth {formatMoney(edition.boothFeeMin)}
                      {edition.boothFeeMax && edition.boothFeeMax !== edition.boothFeeMin
                        ? `–${formatMoney(edition.boothFeeMax)}`
                        : ""}
                    </p>
                  ) : null}
                  {edition?.applicationDeadline ? (
                    <p className="text-[var(--ink-soft)]">
                      Apply by {formatDate(edition.applicationDeadline)}
                    </p>
                  ) : null}
                </div>
              </div>
              {aggregate?.minNMet ? (
                <div className="mt-3 border-t border-[var(--line)] pt-3">
                  <p className="text-sm">
                    Median net {formatMoney(aggregate.medianNet ?? 0)}{" "}
                    <span className="text-[var(--ink-soft)]">(first-party)</span>
                  </p>
                  <SelfReportedNote sampleSize={aggregate.sampleSize} />
                </div>
              ) : null}
            </Link>
          </Panel>
        ))}
      </div>
    </div>
  );
}
