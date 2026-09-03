import type { DriverStats } from "@/lib/gp/drivers";

const LABELS: { key: keyof DriverStats; label: string }[] = [
  { key: "driving", label: "Driving" },
  { key: "speed", label: "Speed" },
  { key: "handling", label: "Handling" },
  { key: "consistency", label: "Consistency" },
  { key: "aggression", label: "Aggression" },
  { key: "luck", label: "Luck" },
];

export function StatBars({
  stats,
  color = "#2ec4b6",
  legendary = false,
}: {
  stats: DriverStats;
  color?: string;
  legendary?: boolean;
}) {
  return (
    <div className="space-y-3">
      {LABELS.map(({ key, label }) => {
        const value = stats[key];
        return (
          <div key={key}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span
                className={
                  legendary ? "text-aruba-gold/90" : "text-white/70"
                }
              >
                {label}
              </span>
              <span
                className={`font-mono text-xs ${
                  legendary ? "text-aruba-gold" : "text-white"
                }`}
              >
                {value}
              </span>
            </div>
            <div className="gp-stat-bar">
              <div
                className={`gp-stat-fill ${legendary ? "shadow-[0_0_12px_rgba(245,215,110,0.65)]" : ""}`}
                style={{
                  width: `${value}%`,
                  background: legendary
                    ? "linear-gradient(90deg,#b8860b,#f5d76e,#ffe9a0)"
                    : color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
