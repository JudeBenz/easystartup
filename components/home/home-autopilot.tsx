import Link from "next/link";
import type { Role } from "@/types/domain";
import { getTodayChecklists } from "@/lib/store";
import { runStatusMeta } from "@/lib/format";
import { StatusDot } from "@/components/status-dot";
import { Progress } from "@/components/ui/progress";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * /home — Stage 2 slot (Builder B owns this). Today's recurring routines for the
 * active role + an "is the business open?" read. Functional placeholder — extend
 * with the full autopilot strip.
 */
export function HomeAutopilot({ role }: { role: Role }) {
  const today = getTodayChecklists(role);
  const complete = today.filter((t) => t.status === "complete").length;
  const open = today.length > 0 && complete === today.length;

  return (
    <section>
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
        02 / Autopilot — today
      </h2>

      <div className="mb-4 border border-rule bg-panel px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            Opening sequence
          </span>
          <StatusDot tone={open ? "green" : "amber"}>
            {open ? "Open for business" : "Opening in progress"}
          </StatusDot>
        </div>
      </div>

      {today.length === 0 ? (
        <Empty>
          <EmptyTitle>No routines for this role today</EmptyTitle>
          <EmptyDescription>
            Recurring routines for this role will show here each morning.
          </EmptyDescription>
        </Empty>
      ) : (
        <ul className="divide-y divide-rule border border-rule bg-panel">
          {today.map(({ checklist, completedCount, totalCount, status }) => {
            const meta = runStatusMeta(status);
            const pct = totalCount
              ? Math.round((completedCount / totalCount) * 100)
              : 0;
            return (
              <li key={checklist.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-display text-sm font-semibold text-ink">
                    {checklist.title}
                  </span>
                  <StatusDot tone={meta.tone}>{meta.label}</StatusDot>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="tnum font-mono text-[10px] text-faint">
                    {completedCount}/{totalCount}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/autopilot"
        className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.12em] text-navy hover:underline"
      >
        Open autopilot →
      </Link>
    </section>
  );
}
