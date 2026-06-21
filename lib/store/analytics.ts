/**
 * Manager analytics helpers — Builder B owns this module (Stage 2 insight layer).
 * Pure reads through the existing store functions; no direct db.ts access.
 */

import { getAttempts, getCertifications } from "./attempts";
import { getAllAssignments } from "./assignments";
import { getProcedures, getStepsForVersion } from "./procedures";
import { demoToday } from "./checklists";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuizFailureCell {
  stepId: string;
  stepTitle: string;
  stepOrder: number;
  /** Number of attempts that had an answer for this quiz step. */
  attemptCount: number;
  /** Attempts where the chosen answer was wrong. */
  failCount: number;
  /** failCount / attemptCount, or 0 if no answers. */
  rate: number;
}

export interface ProcedureFailureRow {
  procedureId: string;
  procedureTitle: string;
  totalAttempts: number;
  steps: QuizFailureCell[];
}

export interface CompetencyEntry {
  procedureId: string;
  procedureTitle: string;
  medianDays: number;
  count: number;
}

export interface TimeToCompetencyResult {
  procedures: CompetencyEntry[];
  overallMedianDays: number;
  totalCertified: number;
}

export interface TrendWeek {
  weekLabel: string;   // "May 25"
  weekStart: string;   // YYYY-MM-DD (Monday)
  count: number;
  isCurrent: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Per-procedure, per-quiz-step failure rate across all completed attempts.
 * Only includes procedures that have quiz steps AND at least one attempt with
 * a quiz answer. Procedures with no quizzes are omitted (nothing to heatmap).
 */
export function getQuizFailureRates(): ProcedureFailureRow[] {
  const procedures = getProcedures().filter((p) => p.status !== "archived");
  const allAttempts = getAttempts().filter((a) => a.completedAt);
  const rows: ProcedureFailureRow[] = [];

  for (const proc of procedures) {
    const quizSteps = getStepsForVersion(proc.id).filter(
      (s) => s.type === "quiz" && s.quizCorrect !== undefined
    );
    if (quizSteps.length === 0) continue;

    const procAttempts = allAttempts.filter((a) => a.procedureId === proc.id);
    if (procAttempts.length === 0) continue;

    const cells: QuizFailureCell[] = quizSteps.map((step) => {
      const answered = procAttempts.filter((a) => step.id in a.answersJson);
      const failed = answered.filter(
        (a) => a.answersJson[step.id] !== step.quizCorrect
      );
      return {
        stepId:       step.id,
        stepTitle:    step.title,
        stepOrder:    step.order,
        attemptCount: answered.length,
        failCount:    failed.length,
        rate:         answered.length > 0 ? failed.length / answered.length : 0,
      };
    });

    rows.push({
      procedureId:    proc.id,
      procedureTitle: proc.title,
      totalAttempts:  procAttempts.length,
      steps:          cells,
    });
  }

  return rows;
}

/**
 * Median days from assignedAt → cert issuedAt, per procedure and overall.
 * Only counts completed training assignments (not standalone compliance certs).
 */
export function getTimeToCompetency(): TimeToCompetencyResult {
  const procedures  = getProcedures();
  const procMap     = new Map(procedures.map((p) => [p.id, p.title]));
  const assignments = getAllAssignments().filter((a) => a.status === "completed");
  const certs       = getCertifications();

  const byProc = new Map<string, number[]>();
  const allDays: number[] = [];

  for (const asg of assignments) {
    // Find a cert issued after the assignment was created (training cert, not compliance).
    const cert = certs.find(
      (c) =>
        c.userId === asg.userId &&
        c.procedureId === asg.procedureId &&
        c.issuedAt >= asg.assignedAt
    );
    if (!cert) continue;

    const days = Math.round(
      (new Date(cert.issuedAt).getTime() - new Date(asg.assignedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (days < 0) continue;

    const list = byProc.get(asg.procedureId) ?? [];
    list.push(days);
    byProc.set(asg.procedureId, list);
    allDays.push(days);
  }

  const entries: CompetencyEntry[] = [];
  for (const [procId, days] of byProc.entries()) {
    entries.push({
      procedureId:    procId,
      procedureTitle: procMap.get(procId) ?? procId,
      medianDays:     median(days),
      count:          days.length,
    });
  }
  entries.sort((a, b) => a.medianDays - b.medianDays);

  return {
    procedures:       entries,
    overallMedianDays: allDays.length > 0 ? median(allDays) : 0,
    totalCertified:   allDays.length,
  };
}

/**
 * Count of completed attempts per calendar week (Monday–Sunday) for the last N
 * weeks, anchored on the demo date. Most recent week first in the result is
 * index [weeks-1]; oldest is index [0].
 */
export function getCompletionTrend(weeks = 6): TrendWeek[] {
  const today = demoToday(); // YYYY-MM-DD

  // Find Monday of the current week
  const todayDate = new Date(`${today}T12:00:00Z`);
  const dow       = todayDate.getUTCDay(); // 0=Sun, 1=Mon…
  const toMonday  = dow === 0 ? -6 : 1 - dow;
  const currentMonday = new Date(todayDate);
  currentMonday.setUTCDate(currentMonday.getUTCDate() + toMonday);

  const attempts = getAttempts().filter((a) => a.completedAt);
  const result: TrendWeek[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = new Date(currentMonday);
    weekStart.setUTCDate(currentMonday.getUTCDate() - w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const startStr = weekStart.toISOString().slice(0, 10);
    const endStr   = weekEnd.toISOString().slice(0, 10);

    const count = attempts.filter((a) => {
      const d = a.completedAt!.slice(0, 10);
      return d >= startStr && d < endStr;
    }).length;

    const label = `${MONTHS_SHORT[weekStart.getUTCMonth()]} ${weekStart.getUTCDate()}`;

    result.push({
      weekLabel: label,
      weekStart: startStr,
      count,
      isCurrent: w === 0,
    });
  }

  return result;
}
