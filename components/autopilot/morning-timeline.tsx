import type { StationState } from "@/lib/store/autopilot";

const STATUS_COLOR: Record<StationState["status"], string> = {
  complete:    "#2C7048",
  in_progress: "#1C3A5E",
  blocked:     "#A6660E",
  pending:     "#8C8B85",
};

const STATUS_LABEL: Record<StationState["status"], string> = {
  complete:    "COMPLETE",
  in_progress: "IN PROGRESS",
  blocked:     "BLOCKED",
  pending:     "PENDING",
};

export function MorningTimeline({ stations }: { stations: StationState[] }) {
  if (stations.length === 0) {
    return (
      <div className="border border-dashed border-rule px-4 py-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
          No stations today
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative border border-rule bg-panel"
      role="list"
      aria-label="Morning opening timeline"
    >
      {/* 1px navy spine */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 top-0"
        style={{ left: 48, width: 1, background: "#1C3A5E", opacity: 0.15 }}
      />

      {stations.map((s) => {
        const color = STATUS_COLOR[s.status];
        return (
          <div
            key={s.checklistId}
            role="listitem"
            className="relative flex items-start border-b border-rule last:border-b-0"
            style={s.status === "blocked" ? { background: "#F6ECD8" } : undefined}
          >
            {/* Station code + hairline tick */}
            <div
              aria-hidden="true"
              className="flex w-12 shrink-0 flex-col items-end pb-3 pr-0 pt-3.5"
            >
              <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-faint">
                {s.code}
              </span>
              <div
                className="mt-1 h-px w-3 shrink-0"
                style={{ background: "#1C3A5E", opacity: 0.2 }}
              />
            </div>

            {/* Status square sitting on the spine */}
            <div
              aria-hidden="true"
              className="relative z-10 mt-3.5 h-2 w-2 shrink-0"
              style={{ background: color }}
            />

            {/* Content */}
            <div className="min-w-0 flex-1 px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-display text-sm font-semibold text-ink">
                    {s.title}
                  </span>
                  {s.userName && s.userName !== "—" && (
                    <span className="ml-2 font-mono text-[10px] text-faint">
                      {s.userName}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className="font-mono text-[9px] uppercase tracking-[0.08em]"
                    style={{ color }}
                  >
                    {STATUS_LABEL[s.status]}
                  </span>
                  <span className="tnum font-mono text-[9px] text-faint">
                    {s.completedCount}/{s.totalCount}
                  </span>
                </div>
              </div>
              {s.blockingReason && (
                <p className="mt-1 text-xs font-medium" style={{ color: "#A6660E" }}>
                  ■ {s.blockingReason}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
