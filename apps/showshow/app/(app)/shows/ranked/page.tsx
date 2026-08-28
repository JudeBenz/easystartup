import Link from "next/link";
import { PageHeader, Panel, SelfReportedNote, Badge } from "@/components/ui";
import { formatMoney, MEDIUM_LABELS } from "@/lib/format";
import { listRankedShows, MIN_N } from "@/lib/store";

export const metadata = { title: "Our rankings" };

export default async function RankedPage() {
  const rows = await listRankedShows();

  return (
    <div>
      <PageHeader
        title="First-party rankings"
        description={`Built only from opted-in artist ROI logs. Minimum n=${MIN_N}. Never from aggregator scores.`}
      />
      {!rows.length ? (
        <Panel>
          <p className="text-[1.05rem] text-[var(--muted)]">
            No shows have met the sample-size threshold yet. Keep logging ROI.
          </p>
        </Panel>
      ) : (
        <ol className="space-y-3">
          {rows.map((row, index) => (
            <li key={row.show.id}>
              <Panel>
                <Link href={`/shows/${row.show.slug}`} className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <span className="font-display text-3xl font-extrabold text-[var(--field)]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-display text-xl font-bold">{row.show.name}</p>
                      <p className="text-[1.05rem] text-[var(--muted)]">
                        {row.show.primaryCity}, {row.show.primaryRegion}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {row.aggregate?.topMediums.map((m) => (
                          <Badge key={m.medium} tone="field">
                            {MEDIUM_LABELS[m.medium]} {Math.round(m.share * 100)}%
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatMoney(row.aggregate?.medianNet ?? 0)}</p>
                    <p className="text-base text-[var(--muted)]">median net</p>
                    <div className="mt-1">
                      <SelfReportedNote sampleSize={row.aggregate?.sampleSize ?? 0} />
                    </div>
                  </div>
                </Link>
              </Panel>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
