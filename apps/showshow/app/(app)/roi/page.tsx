import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate, formatMoney, MEDIUM_LABELS } from "@/lib/format";
import { getSessionArtistId, getSessionUser } from "@/lib/session-data";
import { getEditionOptions, getRoiForArtist } from "@/lib/store";
import { saveRoiAction } from "@/lib/actions";

export const metadata = { title: "ROI tracker" };

export default async function RoiPage() {
  const user = await getSessionUser();
  const artistId = await getSessionArtistId();

  if (!artistId) {
    return (
      <div>
        <PageHeader title="ROI tracker" description="Switch to an artist persona to log private show economics." />
        <Panel>
          <p className="text-sm">Current user ({user.name}) is not an artist. Use the Switch control in the header.</p>
        </Panel>
      </div>
    );
  }

  const rows = await getRoiForArtist(artistId);
  const editions = await getEditionOptions();

  return (
    <div>
      <PageHeader
        eyebrow="Private"
        title="Show ROI tracker"
        description="Your expenses and sales stay private. Opt in to anonymized aggregates that power our rankings."
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">Log a show</h2>
          <form action={saveRoiAction} className="mt-4 grid gap-3 text-sm">
            <input type="hidden" name="artistId" value={artistId} />
            <label className="grid gap-1">
              <span>Show edition</span>
              <select name="editionId" required className="rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2">
                {editions.map(({ edition, showName }) => (
                  <option key={edition.id} value={edition.id}>
                    {showName} ({edition.year})
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field name="boothFee" label="Booth fee" />
              <Field name="travel" label="Travel" />
              <Field name="lodging" label="Lodging" />
              <Field name="otherExpenses" label="Other" />
              <Field name="grossSales" label="Gross sales" />
              <Field name="unitsSold" label="Units sold" />
            </div>
            <label className="grid gap-1">
              <span>Primary medium</span>
              <select name="medium" className="rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2">
                {Object.entries(MEDIUM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span>Notes</span>
              <textarea name="notes" rows={2} className="rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2" />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="optInAggregate" defaultChecked />
              <span>Include anonymized numbers in first-party rankings</span>
            </label>
            <button type="submit" className="rounded-full bg-[var(--signal)] px-4 py-2 font-semibold text-white">
              Save private log
            </button>
          </form>
        </Panel>

        <div className="space-y-3">
          {rows.map(({ report, show, edition, expenses, net, breakdowns }) => (
            <Panel key={report.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-[family-name:var(--font-syne)] text-lg font-bold">{show.name}</p>
                  <p className="text-sm text-[var(--ink-soft)]">
                    {edition.year} · {formatDate(edition.startDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${net >= 0 ? "text-[var(--field)]" : "text-[var(--signal-deep)]"}`}>
                    {formatMoney(net)}
                  </p>
                  <p className="text-xs text-[var(--ink-soft)]">net</p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-[var(--ink-soft)]">Gross</dt>
                  <dd>{formatMoney(report.grossSales)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--ink-soft)]">Expenses</dt>
                  <dd>{formatMoney(expenses)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--ink-soft)]">Booth</dt>
                  <dd>{formatMoney(report.boothFee)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--ink-soft)]">Aggregate</dt>
                  <dd>
                    <Badge tone={report.optInAggregate ? "field" : "neutral"}>
                      {report.optInAggregate ? "opted in" : "private only"}
                    </Badge>
                  </dd>
                </div>
              </dl>
              {breakdowns.length ? (
                <p className="mt-2 text-xs text-[var(--ink-soft)]">
                  {breakdowns.map((b) => `${MEDIUM_LABELS[b.medium]} ${formatMoney(b.sales)}`).join(" · ")}
                </p>
              ) : null}
            </Panel>
          ))}
          {!rows.length ? <Panel><p className="text-sm text-[var(--ink-soft)]">No logs yet.</p></Panel> : null}
        </div>
      </div>
    </div>
  );
}

function Field({ name, label }: { name: string; label: string }) {
  return (
    <label className="grid gap-1">
      <span>{label}</span>
      <input
        type="number"
        name={name}
        min={0}
        step={1}
        defaultValue={0}
        className="rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2"
      />
    </label>
  );
}
