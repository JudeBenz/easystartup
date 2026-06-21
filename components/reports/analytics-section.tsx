import {
  getQuizFailureRates,
  getTimeToCompetency,
  getCompletionTrend,
  type ProcedureFailureRow,
  type TimeToCompetencyResult,
  type TrendWeek,
} from "@/lib/store";

// ── Color helpers ─────────────────────────────────────────────────────────────

/** Interpolate #F6ECD8 → #A6660E by failure rate (0–1). */
function heatBg(rate: number): string {
  const r = Math.round(246 + (166 - 246) * rate);
  const g = Math.round(236 + (102 - 236) * rate);
  const b = Math.round(216 + (14  - 216) * rate);
  return `rgb(${r},${g},${b})`;
}

function heatText(rate: number): string {
  return rate >= 0.55 ? "#FFFFFF" : "#17181B";
}

// ── Sub-visualizations ────────────────────────────────────────────────────────

function CompetencyReadout({ data }: { data: TimeToCompetencyResult }) {
  return (
    <div className="border border-rule bg-panel">
      {/* Headline number */}
      <div className="border-b border-rule px-4 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          Median time-to-cert
        </p>
        {data.totalCertified === 0 ? (
          <p className="mt-2 font-mono text-[11px] text-faint">
            No training completed yet
          </p>
        ) : (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="tnum font-display text-4xl font-bold text-ink">
              {String(data.overallMedianDays).padStart(2, "0")}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
              days
            </span>
          </div>
        )}
      </div>

      {/* Per-procedure rows */}
      {data.procedures.length > 0 && (
        <div aria-label="Time-to-certification by procedure">
          <div className="grid grid-cols-[1fr_56px_56px] divide-x divide-rule border-b border-rule bg-paper">
            {["Procedure", "Med.", "n"].map((h) => (
              <div
                key={h}
                className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-faint"
              >
                {h}
              </div>
            ))}
          </div>
          {data.procedures.map((entry) => (
            <div
              key={entry.procedureId}
              className="grid grid-cols-[1fr_56px_56px] divide-x divide-rule border-b border-rule last:border-b-0"
            >
              <div className="px-3 py-2 text-sm text-soft">{entry.procedureTitle}</div>
              <div className="flex items-center px-3 py-2">
                <span className="tnum font-mono text-[11px] text-navy">
                  {entry.medianDays}d
                </span>
              </div>
              <div className="flex items-center px-3 py-2">
                <span className="tnum font-mono text-[11px] text-faint">
                  {String(entry.count).padStart(2, "0")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function TrendBars({ weeks }: { weeks: TrendWeek[] }) {
  const maxCount = Math.max(1, ...weeks.map((w) => w.count));
  const BAR_MAX  = 80;

  return (
    <div className="border border-rule bg-panel px-4 pb-4 pt-3">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
        Completions per week
      </p>

      {/* Screen-reader list */}
      <ul className="sr-only">
        {weeks.map((w) => (
          <li key={w.weekStart}>
            Week of {w.weekLabel}: {w.count} completion{w.count !== 1 ? "s" : ""}
          </li>
        ))}
      </ul>

      {/* Visual bars */}
      <div aria-hidden="true">
        <div
          className="flex items-end gap-2 border-b border-rule"
          style={{ height: BAR_MAX + 20 }}
        >
          {weeks.map((w) => {
            const barH =
              w.count === 0
                ? 0
                : Math.max(4, Math.round((w.count / maxCount) * BAR_MAX));
            return (
              <div
                key={w.weekStart}
                className="flex flex-1 flex-col items-center justify-end"
              >
                {w.count > 0 && (
                  <span className="mb-1 font-mono text-[9px] text-navy">
                    {w.count}
                  </span>
                )}
                <div
                  style={{
                    height:     barH,
                    width:      "100%",
                    background: w.isCurrent ? "#8C8B85" : "#1C3A5E",
                    minWidth:   8,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Week labels */}
        <div className="mt-2 flex gap-2">
          {weeks.map((w) => (
            <div key={w.weekStart} className="flex-1 text-center">
              <span className="font-mono text-[8px] text-faint">{w.weekLabel}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function FailureHeatmap({ rows }: { rows: ProcedureFailureRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
        Quiz failure rate — per step
      </p>

      {/* Accessible data table */}
      <table className="sr-only">
        <caption>Quiz failure rates by procedure and knowledge-check step</caption>
        <thead>
          <tr>
            <th>Procedure</th>
            <th>Step</th>
            <th>Attempts</th>
            <th>Failure rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.flatMap((row) =>
            row.steps.map((step) => (
              <tr key={`${row.procedureId}-${step.stepId}`}>
                <td>{row.procedureTitle}</td>
                <td>{step.stepTitle}</td>
                <td>{step.attemptCount}</td>
                <td>{Math.round(step.rate * 100)}%</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Visual heatmap */}
      <div className="border border-rule bg-panel" aria-hidden="true">
        {/* Column header row */}
        <div className="flex border-b border-rule bg-paper">
          <div className="w-56 shrink-0 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
            Procedure
          </div>
          <div className="flex flex-1 border-l border-rule">
            <div className="flex-1 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
              Quiz step · failure rate
            </div>
          </div>
          <div className="w-20 shrink-0 border-l border-rule px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
            Attempts
          </div>
        </div>

        {rows.map((row) => (
          <div
            key={row.procedureId}
            className="flex border-b border-rule last:border-b-0"
          >
            {/* Procedure name */}
            <div className="w-56 shrink-0 flex items-center px-4 py-2.5">
              <span className="text-sm text-soft">{row.procedureTitle}</span>
            </div>

            {/* Quiz-step cells */}
            <div className="flex flex-1 border-l border-rule divide-x divide-rule">
              {row.steps.map((step) => {
                const pct = Math.round(step.rate * 100);
                const bg  = heatBg(step.rate);
                const fg  = heatText(step.rate);
                return (
                  <div
                    key={step.stepId}
                    className="flex flex-1 flex-col justify-center px-3 py-2.5"
                    style={{ background: bg }}
                    title={step.stepTitle}
                  >
                    <span
                      className="font-mono text-[13px] font-semibold"
                      style={{ color: fg }}
                    >
                      {pct}%
                    </span>
                    <span
                      className="mt-0.5 font-mono text-[8px]"
                      style={{ color: fg, opacity: 0.7 }}
                    >
                      {step.attemptCount === 0
                        ? "no attempts"
                        : `${step.failCount}/${step.attemptCount}`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Total attempts */}
            <div className="w-20 shrink-0 border-l border-rule flex items-center justify-center px-3 py-2.5">
              <span className="tnum font-mono text-[11px] text-faint">
                {String(row.totalAttempts).padStart(2, "0")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section export ────────────────────────────────────────────────────────────

export function AnalyticsSection() {
  const failureRates = getQuizFailureRates();
  const competency   = getTimeToCompetency();
  const trend        = getCompletionTrend(6);

  return (
    <section>
      {/* Section heading */}
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
          03
        </span>
        <h2 className="font-display text-base font-semibold text-ink">
          Training analytics
        </h2>
        <span className="flex-1 border-t border-rule" />
      </div>

      {/* Row 1: competency readout + trend bars */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CompetencyReadout data={competency} />
        </div>
        <div className="lg:col-span-2">
          <TrendBars weeks={trend} />
        </div>
      </div>

      {/* Row 2: heatmap (only when quiz attempt data exists) */}
      {failureRates.length > 0 ? (
        <div className="mt-4">
          <FailureHeatmap rows={failureRates} />
        </div>
      ) : (
        <div className="mt-4 border border-dashed border-rule px-4 py-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            No quiz attempts yet
          </p>
          <p className="mt-1 text-sm text-soft">
            Failure rates appear here once trainees complete a procedure with a
            knowledge check.
          </p>
        </div>
      )}
    </section>
  );
}
