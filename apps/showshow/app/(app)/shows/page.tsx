import Link from "next/link";
import { PageHeader, Badge, SelfReportedNote } from "@/components/ui";
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
        title="Shows"
        description="Dates, fees, and addresses from each show's own website."
        actions={
          <p className="font-meta flex flex-wrap gap-x-4 gap-y-2 text-[1.05rem]">
            <Link href="/shows/calendar" className="inline-flex min-h-[48px] items-center underline-offset-4 hover:underline">
              Calendar
            </Link>
            <Link href="/shows/map" className="inline-flex min-h-[48px] items-center underline-offset-4 hover:underline">
              Map
            </Link>
            <Link href="/shows/ranked" className="inline-flex min-h-[48px] items-center underline-offset-4 hover:underline">
              Our rankings
            </Link>
          </p>
        }
      />
      <div className="border-t border-[var(--line)]">
        {!current.length ? (
          <p className="py-8 text-[1.125rem] text-[var(--muted)]">
            No upcoming fairs in the directory yet. Check back after the next official-site update.
          </p>
        ) : null}
        {current.map(({ show, current: edition, aggregate, promoted }) => (
          <Link
            key={show.id}
            href={`/shows/${show.slug}`}
            className="block border-b border-[var(--line)] py-5 no-underline hover:bg-[color-mix(in_oklab,var(--surface)_70%,transparent)] md:py-6"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-baseline md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-3">
                  <h2 className="font-display text-[1.65rem] leading-none md:text-[1.9rem]">
                    {show.name}
                  </h2>
                  {promoted ? <Badge tone="signal">Promoted</Badge> : null}
                </div>
                <p className="font-meta mt-2 text-[var(--muted)]">
                  {show.primaryCity}, {show.primaryRegion}
                  {edition
                    ? ` · ${formatDate(edition.startDate)} – ${formatDate(edition.endDate)}`
                    : null}
                </p>
              </div>
              <div className="md:text-right">
                {edition?.boothFeeMin != null ? (
                  <p className="font-meta text-[1.05rem] font-semibold">
                    Booth {formatMoney(edition.boothFeeMin)}
                    {edition.boothFeeMax && edition.boothFeeMax !== edition.boothFeeMin
                      ? `–${formatMoney(edition.boothFeeMax)}`
                      : ""}
                  </p>
                ) : null}
                {edition?.applicationDeadline ? (
                  <p className="font-meta mt-1 text-[var(--muted)]">
                    Apply by {formatDate(edition.applicationDeadline)}
                  </p>
                ) : null}
              </div>
            </div>
            {aggregate?.minNMet ? (
              <div className="mt-3">
                <p className="text-[1.05rem]">
                  Median net {formatMoney(aggregate.medianNet ?? 0)}
                </p>
                <SelfReportedNote sampleSize={aggregate.sampleSize} />
              </div>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
