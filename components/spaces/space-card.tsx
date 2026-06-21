import Link from "next/link";
import type { SpaceView } from "@/lib/store";
import { StatusDot, type StatusTone } from "@/components/status-dot";

function pad(n: number): string {
  return n >= 0 && n < 100 ? String(n).padStart(2, "0") : String(n);
}

const STATUS: Record<SpaceView["status"], { tone: StatusTone; label: string }> = {
  ready: { tone: "green", label: "Ready" },
  attention: { tone: "amber", label: "Attention" },
  empty: { tone: "neutral", label: "No people" },
};

export function SpaceCard({ space }: { space: SpaceView }) {
  const meta = STATUS[space.status];
  return (
    <Link
      href={`/spaces/${space.id}`}
      aria-label={`${space.label} — ${space.jobCount} jobs, ${space.peopleCount} people`}
      className="group flex flex-col border border-rule2 bg-panel p-5 transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-navy">
          {space.code}
        </span>
        <StatusDot tone={meta.tone}>{meta.label}</StatusDot>
      </div>

      <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-ink group-hover:text-navy">
        {space.label}
      </h3>

      <div className="mt-4 grid grid-cols-2 divide-x divide-rule border-t border-rule pt-3">
        <div className="pr-3">
          <div className="tnum font-display text-2xl font-bold leading-none text-ink">
            {pad(space.jobCount)}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            Jobs
          </div>
        </div>
        <div className="pl-3">
          <div className="tnum font-display text-2xl font-bold leading-none text-ink">
            {pad(space.peopleCount)}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            People
          </div>
        </div>
      </div>
    </Link>
  );
}
