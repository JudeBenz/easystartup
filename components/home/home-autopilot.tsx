import Link from "next/link";
import type { Role } from "@/types/domain";
import { getTodayChecklists, getTimeToCompetency, getCompletionTrend } from "@/lib/store";
import { runStatusMeta } from "@/lib/format";
import { StatusDot } from "@/components/status-dot";
import { Progress } from "@/components/ui/progress";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ChecklistWithRun } from "@/lib/store/checklists";

function isBlocked(cwr: ChecklistWithRun): boolean {
  if (cwr.status !== "in_progress" || !cwr.run) return false;
  const next = cwr.checklist.items.find(
    (i) => i.required && !cwr.run!.completedItemIds.includes(i.id)
  );
  return next?.type === "ppe" || next?.type === "warning";
}

// ── Owner-only analytics card ─────────────────────────────────────────────────

function OwnerAnalyticsCard() {
  const competency = getTimeToCompetency();
  const thisWeek   = getCompletionTrend(1)[0]?.count ?? 0;

  return (
    <div className="mt-4 border border-rule bg-panel">
      <div className="flex items-center justify-between border-b border-rule px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          Analytics
        </span>
        <Link
          href="/reports"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-navy hover:underline"
        >
          View reports →
        </Link>
      </div>
      <div className="grid grid-cols-2 divide-x divide-rule">
        <div className="px-4 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
            Median cert time
          </p>
          {competency.totalCertified === 0 ? (
            <p className="mt-1 font-mono text-[10px] text-faint">—</p>
          ) : (
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="tnum font-display text-2xl font-bold text-ink">
                {String(competency.overallMedianDays).padStart(2, "0")}
              </span>
              <span className="font-mono text-[9px] uppercase text-faint">days</span>
            </div>
          )}
        </div>
        <div className="px-4 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
            Completions this week
          </p>
          <div className="mt-1">
            <span className="tnum font-display text-2xl font-bold text-ink">
              {String(thisWeek).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Autopilot section ─────────────────────────────────────────────────────────

/**
 * /home — Stage 2 autopilot slot (Builder B). Today's routines for the active
 * role + the "is the business open?" signal. Leaves home-training.tsx to A.
 */
export function HomeAutopilot({ role }: { role: Role }) {
  const today = getTodayChecklists(role);
  const complete = today.filter((t) => t.status === "complete").length;
  const blocked = today.filter(isBlocked).length;
  const isOpen = today.length > 0 && complete === today.length;

  return (
    <section>
      {/* Section heading */}
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
          02
        </span>
        <h2 className="font-display text-base font-semibold text-ink">
          Autopilot — today
        </h2>
        <span className="flex-1 border-t border-rule" />
      </div>

      {/* Opening status banner */}
      <div
        className="mb-3 border px-4 py-3 flex items-center justify-between"
        style={{
          borderColor: isOpen ? "#2C7048" : blocked > 0 ? "#A6660E" : "#1C3A5E",
          background: isOpen ? "#E6F0E6" : blocked > 0 ? "#F6ECD8" : "#E8EEF6",
        }}
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            Opening sequence
          </p>
          <p className="mt-0.5 font-display text-sm font-semibold text-ink">
            {isOpen
              ? "Open for business"
              : blocked > 0
              ? `${blocked} routine${blocked > 1 ? "s" : ""} blocked`
              : `${complete} of ${today.length} complete`}
          </p>
        </div>
        <StatusDot tone={isOpen ? "green" : blocked > 0 ? "amber" : "navy"}>
          {isOpen ? "Open" : blocked > 0 ? "Blocked" : "In progress"}
        </StatusDot>
      </div>

      {/* Routine list */}
      {today.length === 0 ? (
        <Empty className="py-8">
          <EmptyTitle>No routines for this role today</EmptyTitle>
          <EmptyDescription>
            Recurring routines for this role will appear here each morning.
          </EmptyDescription>
        </Empty>
      ) : (
        <ul className="divide-y divide-rule border border-rule bg-panel">
          {today.map((cwr) => {
            const blocked_item = isBlocked(cwr);
            const meta = runStatusMeta(cwr.status);
            const pct = cwr.totalCount
              ? Math.round((cwr.completedCount / cwr.totalCount) * 100)
              : 0;
            return (
              <li
                key={cwr.checklist.id}
                className="px-4 py-3"
                style={blocked_item ? { background: "#F6ECD8" } : undefined}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-display text-sm font-semibold text-ink">
                    {cwr.checklist.title}
                  </span>
                  <StatusDot tone={blocked_item ? "amber" : meta.tone}>
                    {blocked_item ? "Blocked" : meta.label}
                  </StatusDot>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="tnum font-mono text-[10px] text-faint">
                    {cwr.completedCount}/{cwr.totalCount}
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

      {role === "owner" && <OwnerAnalyticsCard />}
    </section>
  );
}
