import Link from "next/link";
import { PageHeader, Panel, Badge, SelfReportedNote } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import { listShows } from "@/lib/store";

export const metadata = { title: "Shows" };

export default async function ShowsPage() {
  const rows = await listShows();
  const current = rows.filter(
    (r) => r.current && (r.current.status === "upcoming" || r.current.status === "active"),
  );

  return (
    <div>
      <PageHeader
        title="Art fair directory"
        description="Dates, fees, and addresses from each show's own website. No copied rankings."
        actions={
          <>
            <Link className="ss-btn ss-btn-secondary" href="/shows/calendar">
              Calendar
            </Link>
            <Link className="ss-btn ss-btn-ghost" href="/shows/map">
              Map
            </Link>
            <Link className="ss-btn ss-btn-ghost" href="/shows/ranked">
              Our rankings
            </Link>
          </>
        }
      />
      <div className="grid gap-3">
        {current.map(({ show, current: edition, aggregate, promoted }) => (
          <Panel key={show.id} className="!p-0">
            <Link
              href={`/shows/${show.slug}`}
              className="block p-5 no-underline transition hover:bg-[var(--paper)] md:p-6"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-[1.5rem] leading-tight md:text-[1.75rem]">
                      {show.name}
                    </h2>
                    {promoted ? <Badge tone="signal">Promoted</Badge> : null}
                  </div>
                  <p className="mt-1 text-[1.125rem] text-[var(--muted)]">
                    {show.primaryCity}, {show.primaryRegion}
                    {edition
                      ? ` · ${formatDate(edition.startDate)} – ${formatDate(edition.endDate)}`
                      : null}
                  </p>
                </div>
                <div className="md:text-right">
                  {edition?.boothFeeMin != null ? (
                    <p className="text-[1.25rem] font-bold">
                      Booth {formatMoney(edition.boothFeeMin)}
                      {edition.boothFeeMax && edition.boothFeeMax !== edition.boothFeeMin
                        ? `–${formatMoney(edition.boothFeeMax)}`
                        : ""}
                    </p>
                  ) : null}
                  {edition?.applicationDeadline ? (
                    <p className="text-[1.05rem] text-[var(--muted)]">
                      Apply by {formatDate(edition.applicationDeadline)}
                    </p>
                  ) : null}
                </div>
              </div>
              {aggregate?.minNMet ? (
                <div className="mt-4 border-t border-[var(--line)] pt-3">
                  <p className="text-[1.125rem] font-bold">
                    Median net {formatMoney(aggregate.medianNet ?? 0)}
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
