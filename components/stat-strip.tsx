import { cn } from "@/lib/utils";

export interface Stat {
  label: string;
  value: string | number;
  /** Optional accent for the value (e.g. overdue in amber/red). */
  tone?: "ink" | "navy" | "amber" | "green" | "red";
}

const toneClass: Record<NonNullable<Stat["tone"]>, string> = {
  ink: "text-ink",
  navy: "text-navy",
  amber: "text-amber",
  green: "text-green",
  red: "text-destructive",
};

/** Pad small integers to two digits (06) per the design language. */
function display(value: string | number): string {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value < 100) {
    return String(value).padStart(2, "0");
  }
  return String(value);
}

/** A readout strip — ruled band, hairline cells, big tabular numbers. */
export function StatStrip({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <div
      className={cn(
        "grid divide-x divide-rule border border-rule bg-panel",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
    >
      {stats.map((s) => (
        <div key={s.label} className="px-4 py-3">
          <div
            className={cn(
              "tnum font-display text-2xl font-bold leading-none",
              toneClass[s.tone ?? "ink"]
            )}
          >
            {display(s.value)}
          </div>
          <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
