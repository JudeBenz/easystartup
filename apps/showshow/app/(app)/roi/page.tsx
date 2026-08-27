import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatDate, formatMoney, MEDIUM_LABELS } from "@/lib/format";
import { getSessionArtistId, getSessionUser } from "@/lib/session-data";
import { getEditionOptions, getRoiForArtist, getShowRoiSignal, listShows } from "@/lib/store";
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
  const shows = await listShows();
  const signals = await Promise.all(
    shows.slice(0, 12).map(async (row) => ({
      show: row.show,
      signal: await getShowRoiSignal(row.show.id),
    })),
  );
  const peerSignals = signals.filter((s) => s.signal && s.signal.sampleSize > 0);

  // YoY for this artist's own logs
  const byShow = new Map<string, { year: number; net: number }[]>();
  for (const row of rows) {
    const list = byShow.get(row.show.id) ?? [];
    list.push({ year: row.edition.year, net: row.net });
    byShow.set(row.show.id, list);
  }

  return (
    <div>
      <PageHeader
        title="Show ROI tracker"
        description="Your numbers stay private. Opt in to anonymous rankings. Peer signals use opted-in artist reports only — never guidebook scores."
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
              <Field name="hoursWorked" label="Hours worked" />
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
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="ss-label">
                Second medium (optional)
                <select name="medium2" className="ss-select" defaultValue="">
                  <option value="">—</option>
                  {Object.entries(MEDIUM_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <Field name="sales2" label="Second medium sales ($)" />
            </div>
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
            <button type="submit" className="ss-btn ss-btn-primary min-h-[var(--tap)]">
              Save private log
            </button>
          </form>
        </Panel>

        <div className="space-y-3">
          {rows.map(({ report, show, edition, expenses, net, breakdowns }) => {
            const history = byShow.get(show.id) ?? [];
            const prior = history.find((h) => h.year === edition.year - 1);
            return (
              <Panel key={report.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-[1.4rem]">{show.name}</p>
                    <p className="text-[1.05rem] text-[var(--muted)]">
                      {edition.year} · {formatDate(edition.startDate)}
                      {report.hoursWorked
                        ? ` · ${report.hoursWorked} hrs`
                        : ""}
                    </p>
                    {prior ? (
                      <p className="mt-1 text-base text-[var(--muted)]">
                        YoY vs {prior.year}:{" "}
                        <span className="font-bold">
                          {formatMoney(net - prior.net)}
                        </span>
                      </p>
                    ) : null}
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
            );
          })}
          {!rows.length ? (
            <Panel>
              <p className="text-[1.125rem] text-[var(--muted)]">No logs yet.</p>
            </Panel>
          ) : null}
        </div>
      </div>

      {peerSignals.length ? (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-[1.5rem]">Peer “worth applying?” signals</h2>
          <p className="mb-4 max-w-2xl text-[1.05rem] text-[var(--muted)]">
            Built only from opted-in ShowShow ROI logs. Blank when sample size is thin.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {peerSignals.map(({ show, signal }) =>
              signal ? (
                <Panel key={show.id}>
                  <p className="font-display text-lg">{show.name}</p>
                  <p className="mt-1 text-base text-[var(--muted)]">
                    n={signal.sampleSize} · median net {formatMoney(signal.medianNet)}
                  </p>
                  <p className="mt-2">
                    {signal.worthApplying == null ? (
                      <Badge>need more reports</Badge>
                    ) : signal.worthApplying ? (
                      <Badge tone="field">peers net positive</Badge>
                    ) : (
                      <Badge tone="warn">peers mixed / negative</Badge>
                    )}
                  </p>
                  {signal.yoy.length > 1 ? (
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      YoY{" "}
                      {signal.yoy
                        .map((y) => `${y.year}: ${formatMoney(y.medianNet)}`)
                        .join(" → ")}
                    </p>
                  ) : null}
                </Panel>
              ) : null,
            )}
          </div>
        </section>
      ) : null}
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
