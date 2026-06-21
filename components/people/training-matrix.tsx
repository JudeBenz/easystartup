import Link from "next/link";
import type { TrainingMatrix } from "@/lib/store/training-matrix";
import { MatrixCell } from "./matrix-cell";

const LEGEND: { color: string; label: string }[] = [
  { color: "#2C7048", label: "Certified" },
  { color: "#A6660E", label: "Expired / outdated" },
  { color: "#1C3A5E", label: "Assigned / in progress" },
];

export function TrainingMatrixTable({ matrix }: { matrix: TrainingMatrix }) {
  if (matrix.rows.length === 0 || matrix.procedures.length === 0) {
    return (
      <div className="border border-dashed border-rule px-4 py-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
          No data
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="mb-3 flex items-center gap-5">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-[9px] w-[9px] shrink-0"
              style={{ background: l.color }}
              aria-hidden="true"
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-faint">
              {l.label}
            </span>
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[9px] w-[9px] shrink-0 border border-rule" aria-hidden="true" />
          <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-faint">
            Not trained — click to assign
          </span>
        </span>
      </div>

      {/* Scrollable wrapper (person column stays frozen) */}
      <div className="overflow-x-auto border border-rule">
        <table
          className="border-collapse bg-panel"
          aria-label="Team training matrix"
        >
          <thead>
            <tr>
              {/* Frozen person column header */}
              <th
                scope="col"
                className="sticky left-0 z-20 min-w-[140px] border-b border-r border-rule bg-paper px-4 py-2 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-faint"
              >
                Person
              </th>
              {matrix.procedures.map((p) => (
                <th
                  key={p.id}
                  scope="col"
                  title={p.title}
                  className="w-11 border-b border-r border-rule bg-paper px-0 py-2 text-center font-mono text-[8px] uppercase tracking-[0.06em] text-faint"
                >
                  {p.code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row) => (
              <tr key={row.userId}>
                {/* Frozen name column */}
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b border-r border-rule bg-panel px-4 py-0 text-left font-weight-normal"
                >
                  <Link
                    href={`/people/${row.userId}`}
                    className="block py-2.5 font-display text-sm font-semibold text-ink hover:text-navy hover:underline transition-colors"
                  >
                    {row.userName}
                  </Link>
                </th>
                {/* Training cells */}
                {row.cells.map((cell) => (
                  <MatrixCell
                    key={cell.procedureId}
                    userId={cell.userId}
                    userName={row.userName}
                    procedureId={cell.procedureId}
                    procedureTitle={
                      matrix.procedures.find((p) => p.id === cell.procedureId)
                        ?.title ?? cell.procedureId
                    }
                    status={cell.status}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
