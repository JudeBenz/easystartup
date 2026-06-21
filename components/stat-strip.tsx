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

// Static class strings so Tailwind's content scan keeps them. Base is 2 columns
// on phones; expands to one column per stat from the `sm` breakpoint up.
const smCols: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-6",
};

/** Pad small integers to two digits (06) per the design language. */
function display(value: string | number): string {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value < 100) {
    return String(value).padStart(2, "0");
  }
  return String(value);
}

/**
 * A readout strip — ruled band, hairline cells, big tabular numbers. Wraps to a
 * 2-column grid on phones; per-cell borders keep clean hairlines at any wrap.
 */
export function StatStrip({ stats, className }: { stats: Stat[]; className?: string }) {
  const cols = smCols[stats.length] ?? "grid-cols-2 sm:grid-cols-4";
  return (
    <div
      className={cn(
        "grid border-l border-t border-rule bg-panel",
        cols,
        className
      )}
    >
      {stats.map((s) => (
        <div key={s.label} className="border-b border-r border-rule px-4 py-3">
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
