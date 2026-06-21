import Link from "next/link";
import { getRole } from "@/lib/session";
import {
  getTodayChecklists,
  getOrg,
  demoToday,
  getMorningStatus,
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
import { OpenBanner } from "@/components/autopilot/open-banner";
import { MorningTimeline } from "@/components/autopilot/morning-timeline";
import { BlockerCard } from "@/components/autopilot/blocker-card";

// ── Blocked detection (needed for routines section detail) ────────────────────

function isBlocked(cwr: ChecklistWithRun): boolean {
  if (cwr.status !== "in_progress" || !cwr.run) return false;
  const next = cwr.checklist.items.find(
    (i) => i.required && !cwr.run!.completedItemIds.includes(i.id)
  );
  return next?.type === "ppe" || next?.type === "warning";
}

function blockingItem(cwr: ChecklistWithRun): string | null {
  if (!isBlocked(cwr)) return null;
  return (
    cwr.checklist.items.find(
      (i) => i.required && !cwr.run!.completedItemIds.includes(i.id)
    )?.label ?? null
  );
}

const ROLE_LABEL = { owner: "Owner", trainer: "Trainer", employee: "Employee" } as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AutopilotPage() {
  await getRole();
  const org      = getOrg();
  const todayStr = demoToday();
  const status   = getMorningStatus();

  // Full ChecklistWithRun objects needed for the routines detail rows
  const all = getTodayChecklists();
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

      {/* ── 01 / Open verdict ───────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">01</span>
          <h2 className="font-display text-base font-semibold text-ink">Open verdict</h2>
          <span className="flex-1 border-t border-rule" />
        </div>

        <OpenBanner
          isOpen={status.isOpen}
          blocked={status.blocked}
          complete={status.complete}
          total={status.total}
          initialSecondsRemaining={status.initialSecondsRemaining}
        />

        <StatStrip
          className="mt-3"
          stats={[
            { label: "Total routines", value: status.total },
            { label: "Complete",       value: status.complete,   tone: status.complete > 0 ? "green" : "ink" },
            { label: "In progress",    value: status.inProgress, tone: status.inProgress > 0 ? "navy" : "ink" },
            { label: "Blocked",        value: status.blocked,    tone: status.blocked > 0 ? "amber" : "ink" },
            { label: "Pending",        value: status.pending },
          ]}
        />
      </section>

      {/* ── 02 / Morning timeline ───────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">02</span>
          <h2 className="font-display text-base font-semibold text-ink">Morning timeline</h2>
          <span className="flex-1 border-t border-rule" />
        </div>

        <MorningTimeline stations={status.stations} />

        {/* Escalation cards — shown inline below the timeline when blockers exist */}
        {status.blockers.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-amber">
              Escalations needed — {status.blockers.length} block
              {status.blockers.length !== 1 ? "s" : ""}
            </p>
            {status.blockers.map((b) => (
              <BlockerCard key={b.checklistId} blocker={b} />
            ))}
          </div>
        )}
      </section>

      {/* ── 03 / Today's routines ───────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy">03</span>
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
                      const blocker      = blockingItem(cwr);
                      const meta         = runStatusMeta(cwr.status);
                      const pct          = cwr.totalCount
                        ? Math.round((cwr.completedCount / cwr.totalCount) * 100)
                        : 0;
                      return (
                        <li
                          key={cwr.checklist.id}
                          className="group px-4 py-3 transition-colors hover:bg-navy-tint/40"
                          style={blocked_item ? { background: "#F6ECD8" } : undefined}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className="font-display text-sm font-semibold text-ink transition-colors group-hover:text-navy">
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
