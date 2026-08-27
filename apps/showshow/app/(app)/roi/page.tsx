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
        <PageHeader
          title="ROI tracker"
          description="Switch to an artist (Aria or Sam) in Menu to log private show economics."
        />
        <Panel>
          <p className="text-[1.125rem]">
            {user.name} is not set up as an artist in this demo.
          </p>
        </Panel>
      </div>
    );
  }

  const rows = await getRoiForArtist(artistId);
  const editions = await getEditionOptions();

  return (
    <div>
      <PageHeader
        title="Show ROI tracker"
        description="Your numbers stay private. Check the box if you want them counted in anonymous rankings."
      />

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <h2 className="font-display text-[1.5rem]">Log a show</h2>
          <form action={saveRoiAction} className="mt-5 grid gap-4">
            <input type="hidden" name="artistId" value={artistId} />
            <label className="ss-label">
              Show
              <select name="editionId" required className="ss-select">
                {editions.map(({ edition, showName }) => (
                  <option key={edition.id} value={edition.id}>
                    {showName} ({edition.year})
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="boothFee" label="Booth fee ($)" />
              <Field name="travel" label="Travel ($)" />
              <Field name="lodging" label="Lodging ($)" />
              <Field name="otherExpenses" label="Other costs ($)" />
              <Field name="grossSales" label="Gross sales ($)" />
              <Field name="unitsSold" label="Pieces sold" />
            </div>
            <label className="ss-label">
              Main medium sold
              <select name="medium" className="ss-select">
                {Object.entries(MEDIUM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="ss-label">
              Notes
              <textarea name="notes" rows={3} className="ss-textarea" />
            </label>
            <label className="flex min-h-[var(--tap)] items-start gap-3 text-[1.125rem]">
              <input
                type="checkbox"
                name="optInAggregate"
                defaultChecked
                className="mt-1 h-6 w-6 shrink-0"
              />
              <span>Include my anonymized numbers in first-party rankings</span>
            </label>
            <button type="submit" className="ss-btn ss-btn-primary">
              Save private log
            </button>
          </form>
        </Panel>

        <div className="space-y-3">
          {rows.map(({ report, show, edition, expenses, net, breakdowns }) => (
            <Panel key={report.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[1.4rem]">{show.name}</p>
                  <p className="text-[1.05rem] text-[var(--muted)]">
                    {edition.year} · {formatDate(edition.startDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-[1.75rem] font-bold ${
                      net >= 0 ? "text-[var(--good)]" : "text-[var(--accent-deep)]"
                    }`}
                  >
                    {formatMoney(net)}
                  </p>
                  <p className="text-base text-[var(--muted)]">net</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-[1.05rem] sm:grid-cols-4">
                <div>
                  <dt className="text-base text-[var(--muted)]">Gross</dt>
                  <dd className="font-bold">{formatMoney(report.grossSales)}</dd>
                </div>
                <div>
                  <dt className="text-base text-[var(--muted)]">Expenses</dt>
                  <dd className="font-bold">{formatMoney(expenses)}</dd>
                </div>
                <div>
                  <dt className="text-base text-[var(--muted)]">Booth</dt>
                  <dd className="font-bold">{formatMoney(report.boothFee)}</dd>
                </div>
                <div>
                  <dt className="text-base text-[var(--muted)]">Ranking</dt>
                  <dd>
                    <Badge tone={report.optInAggregate ? "field" : "neutral"}>
                      {report.optInAggregate ? "opted in" : "private only"}
                    </Badge>
                  </dd>
                </div>
              </dl>
              {breakdowns.length ? (
                <p className="mt-3 text-base text-[var(--muted)]">
                  {breakdowns
                    .map((b) => `${MEDIUM_LABELS[b.medium]} ${formatMoney(b.sales)}`)
                    .join(" · ")}
                </p>
              ) : null}
            </Panel>
          ))}
          {!rows.length ? (
            <Panel>
              <p className="text-[1.125rem] text-[var(--muted)]">No logs yet.</p>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ name, label }: { name: string; label: string }) {
  return (
    <label className="ss-label">
      {label}
      <input
        type="number"
        name={name}
        min={0}
        step={1}
        defaultValue={0}
        className="ss-input"
        inputMode="numeric"
      />
    </label>
  );
}
