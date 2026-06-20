import type {
  Checklist,
  ChecklistRun,
  ChecklistRunStatus,
  Role,
} from "@/types/domain";
import { db, newId, save } from "./db";
import { dateFrom } from "./seed/util";

/**
 * Builder B owns this module (Stage 2 autopilot / recurring routines).
 * Reads + basic run mutations are provided so /autopilot and /checklists work
 * from the integration point; extend freely.
 */

/** The demo "today" — matches the seeded runs so autopilot shows live state. */
export function demoToday(): string {
  return dateFrom(0);
}

// ---- reads -----------------------------------------------------------------

export function getChecklists(): Checklist[] {
  return db().checklists.slice();
}

export function getChecklist(id: string): Checklist | undefined {
  return db().checklists.find((c) => c.id === id);
}

export function getChecklistsForRole(role: Role): Checklist[] {
  return getChecklists().filter((c) => c.role === role);
}

export function getRunsForDate(date: string): ChecklistRun[] {
  return db().checklistRuns.filter((r) => r.date === date);
}

export function getTodayRuns(): ChecklistRun[] {
  return getRunsForDate(demoToday());
}

export function getRun(
  checklistId: string,
  date: string
): ChecklistRun | undefined {
  return db().checklistRuns.find(
    (r) => r.checklistId === checklistId && r.date === date
  );
}

export interface ChecklistWithRun {
  checklist: Checklist;
  run?: ChecklistRun;
  completedCount: number;
  totalCount: number;
  status: ChecklistRunStatus;
}

/** Checklists for a role joined with today's run state — the autopilot view. */
export function getTodayChecklists(role?: Role): ChecklistWithRun[] {
  const date = demoToday();
  const lists = role ? getChecklistsForRole(role) : getChecklists();
  return lists.map((checklist) => {
    const run = getRun(checklist.id, date);
    const completedCount = run?.completedItemIds.length ?? 0;
    return {
      checklist,
      run,
      completedCount,
      totalCount: checklist.items.length,
      status: run?.status ?? "pending",
    };
  });
}

// ---- mutations -------------------------------------------------------------

export function getOrCreateRun(
  checklistId: string,
  userId: string,
  date = demoToday()
): ChecklistRun {
  const existing = getRun(checklistId, date);
  if (existing) return existing;
  const run: ChecklistRun = {
    id: newId("run"),
    checklistId,
    userId,
    date,
    completedItemIds: [],
    status: "in_progress",
  };
  db().checklistRuns.push(run);
  save();
  return run;
}

function recomputeStatus(run: ChecklistRun): void {
  const checklist = getChecklist(run.checklistId);
  if (!checklist) return;
  const required = checklist.items.filter((i) => i.required).map((i) => i.id);
  const done = required.every((id) => run.completedItemIds.includes(id));
  if (run.completedItemIds.length === 0) run.status = "pending";
  else if (done) run.status = "complete";
  else run.status = "in_progress";
}

export function toggleRunItem(
  runId: string,
  itemId: string
): ChecklistRun | undefined {
  const run = db().checklistRuns.find((r) => r.id === runId);
  if (!run) return undefined;
  if (run.completedItemIds.includes(itemId)) {
    run.completedItemIds = run.completedItemIds.filter((id) => id !== itemId);
  } else {
    run.completedItemIds.push(itemId);
  }
  recomputeStatus(run);
  save();
  return run;
}

export function completeRun(runId: string): ChecklistRun | undefined {
  const run = db().checklistRuns.find((r) => r.id === runId);
  if (!run) return undefined;
  const checklist = getChecklist(run.checklistId);
  if (checklist) {
    run.completedItemIds = checklist.items.map((i) => i.id);
  }
  run.status = "complete";
  save();
  return run;
}
