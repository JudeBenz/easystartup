import Link from "next/link";
import { getRole } from "@/lib/session";
import {
  getTodayChecklists,
  getChecklists,
  getTodayRuns,
  getOrg,
  demoToday,
} from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { StatStrip } from "@/components/stat-strip";
import { StatusDot } from "@/components/status-dot";
import { Progress } from "@/components/ui/progress";
import { runStatusMeta } from "@/lib/format";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ChecklistWithRun } from "@/lib/store/checklists";

// ── Blocked detection (same logic as twin page) ───────────────────────────────

function isBlocked(cwr: ChecklistWithRun): boolean {
  if (cwr.status !== "in_progress" || !cwr.run) return false;
  const next = cwr.checklist.items.find(
    (i) => i.required && !cwr.run!.completedItemIds.includes(i.id)
  );
  return next?.type === "ppe" || next?.type === "warning";
}

function blockingItem(cwr: ChecklistWithRun): string | null {
  if (!isBlocked(cwr)) return null;
  const next = cwr.checklist.items.find(
    (i) => i.required && !cwr.run!.completedItemIds.includes(i.id)
  );
  return next?.label ?? null;
}

// ── Role label ────────────────────────────────────────────────────────────────

const ROLE_LABEL = { owner: "Owner", trainer: "Trainer", employee: "Employee" } as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AutopilotPage() {
  const role = await getRole();
  const org = getOrg();

  // All checklists + runs for the morning view (not filtered by role so owner sees everything).
  const all = getTodayChecklists();
  const todayStr = demoToday();

  const total    = all.length;
  const complete = all.filter((c) => c.status === "complete").length;
  const inProg   = all.filter((c) => c.status === "in_progress" && !isBlocked(c)).length;
  const blocked  = all.filter(isBlocked).length;
  const pending  = all.filter((c) => c.status === "pending").length;

  const isOpen = complete === total && total > 0;

  // Group by checklist role
  const grouped: Record<string, ChecklistWithRun[]> = {};
  for (const cwr of all) {
    const r = cwr.checklist.role;
    (grouped[r] ??= []).push(cwr);
  }

  return (
    <div>
      <PageHeader
        eyebrow={`AUTOPILOT · ${todayStr}`}
        title="Morning run"
        description={`${org.name} — is the business open yet?`}
      />

      {/* ── 01 / Opening status ─────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
            01
          </span>
          <h2 className="font-display text-base font-semibold text-ink">
            Opening status
          </h2>
          <span className="flex-1 border-t border-rule" />
        </div>

        <div
          className="border-2 px-5 py-4 flex items-center justify-between"
          style={{
            borderColor: isOpen ? "#2C7048" : blocked > 0 ? "#A6660E" : "#1C3A5E",
            background: isOpen ? "#E6F0E6" : blocked > 0 ? "#F6ECD8" : "#E8EEF6",
          }}
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint mb-1">
              {org.name}
            </p>
            <p className="font-display text-2xl font-bold tracking-tight text-ink">
              {isOpen
                ? "Open for business"
                : blocked > 0
                ? "Opening blocked"
                : "Opening in progress"}
            </p>
            <p className="mt-1 text-sm text-soft">
              {complete} of {total} routines complete
              {blocked > 0 && ` · ${blocked} blocked on PPE`}
            </p>
          </div>
          <StatusDot
            tone={isOpen ? "green" : blocked > 0 ? "amber" : "navy"}
            className="text-base"
          >
            {isOpen ? "Open" : blocked > 0 ? "Blocked" : "In progress"}
          </StatusDot>
        </div>

        <StatStrip
          className="mt-3"
          stats={[
            { label: "Total routines", value: total },
            { label: "Complete",       value: complete, tone: complete > 0 ? "green" : "ink" },
            { label: "In progress",    value: inProg,   tone: inProg > 0 ? "navy" : "ink" },
            { label: "Blocked",        value: blocked,  tone: blocked > 0 ? "amber" : "ink" },
            { label: "Pending",        value: pending },
          ]}
        />
      </section>

      {/* ── 02 / Today's routines ────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
            02
          </span>
          <h2 className="font-display text-base font-semibold text-ink">
            Today&apos;s routines
          </h2>
          <span className="flex-1 border-t border-rule" />
        </div>

        {all.length === 0 ? (
          <Empty>
            <EmptyTitle>No routines scheduled today</EmptyTitle>
            <EmptyDescription>
              Add recurring checklists to procedures so the autopilot can track
              them here each morning.
            </EmptyDescription>
          </Empty>
        ) : (
          <div className="space-y-6">
            {(["owner", "trainer", "employee"] as const).map((r) => {
              const items = grouped[r];
              if (!items?.length) return null;
              return (
                <div key={r}>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                    {ROLE_LABEL[r]}
                  </p>
                  <ul className="divide-y divide-rule border border-rule bg-panel">
                    {items.map((cwr) => {
                      const blocked_item = isBlocked(cwr);
                      const blocker = blockingItem(cwr);
                      const meta = runStatusMeta(cwr.status);
                      const pct = cwr.totalCount
                        ? Math.round((cwr.completedCount / cwr.totalCount) * 100)
                        : 0;
                      return (
                        <li
                          key={cwr.checklist.id}
                          className="px-4 py-3 group transition-colors hover:bg-navy-tint/40"
                          style={
                            blocked_item
                              ? { background: "#F6ECD8" }
                              : undefined
                          }
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className="font-display text-sm font-semibold text-ink group-hover:text-navy transition-colors">
                                {cwr.checklist.title}
                              </span>
                              {cwr.checklist.procedureId && (
                                <span className="ml-2 font-mono text-[10px] text-faint">
                                  {cwr.checklist.cadence.toUpperCase()}
                                </span>
                              )}
                              {blocked_item && blocker && (
                                <p className="mt-0.5 text-xs text-amber">
                                  ■ Blocked at: {blocker}
                                </p>
                              )}
                            </div>
                            <StatusDot
                              tone={blocked_item ? "amber" : meta.tone}
                              className="shrink-0"
                            >
                              {blocked_item ? "Blocked" : meta.label}
                            </StatusDot>
                          </div>
                          <div className="mt-2 flex items-center gap-3">
                            <Progress value={pct} className="h-1.5 flex-1" />
                            <span className="tnum font-mono text-[10px] text-faint">
                              {cwr.completedCount}/{cwr.totalCount}
                            </span>
                            <Link
                              href={`/checklists/${cwr.checklist.id}/run`}
                              className="font-mono text-[10px] uppercase tracking-[0.1em] text-navy hover:underline"
                            >
                              {cwr.status === "pending" ? "Start →" : "Continue →"}
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
