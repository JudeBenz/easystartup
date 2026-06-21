/**
 * Autopilot intelligence layer — Builder B owns this module.
 * Reads from existing store functions only; no direct db access.
 */

import { getTodayChecklists, demoToday } from "./checklists";
import { getCertifications } from "./attempts";
import { getUsers, getUsersByRole } from "./people";
import { getProcedure } from "./procedures";
import { DEMO_NOW } from "./seed/util";
import type { ChecklistWithRun } from "./checklists";
import type { Role } from "@/types/domain";

// ── Types ─────────────────────────────────────────────────────────────────────

export type StationStatus = "complete" | "in_progress" | "blocked" | "pending";

export interface StationState {
  checklistId:    string;
  title:          string;
  code:           string;  // short display code, e.g. "CNC", "WELD", "QC"
  userId:         string;
  userName:       string;
  role:           Role;
  status:         StationStatus;
  completedCount: number;
  totalCount:     number;
  blockingReason?: string;
}

export interface BlockerInfo {
  checklistId:       string;
  checklistTitle:    string;
  userId:            string;
  userName:          string;
  blockingItemLabel: string;
  /** Expired cert procedure title, if found. */
  expiredCertTitle?: string;
  /** Who should handle the escalation (trainer by default). */
  escalateTo: string;
}

export interface MorningStatus {
  isOpen:     boolean;
  total:      number;
  complete:   number;
  inProgress: number;
  blocked:    number;
  pending:    number;
  stations:   StationState[];
  blockers:   BlockerInfo[];
  /** Seconds from DEMO_NOW to shift start (1920 = 32 min for the demo). */
  initialSecondsRemaining: number;
}

// ── Shift config ──────────────────────────────────────────────────────────────

const SHIFT_H = 7;
const SHIFT_M = 30;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isBlockedCwr(cwr: ChecklistWithRun): boolean {
  if (cwr.status !== "in_progress" || !cwr.run) return false;
  const next = cwr.checklist.items.find(
    (i) => i.required && !cwr.run!.completedItemIds.includes(i.id)
  );
  return next?.type === "ppe" || next?.type === "warning";
}

function blockingItemLabelOf(cwr: ChecklistWithRun): string | null {
  if (!isBlockedCwr(cwr)) return null;
  return (
    cwr.checklist.items.find(
      (i) => i.required && !cwr.run!.completedItemIds.includes(i.id)
    )?.label ?? null
  );
}

function stationCode(title: string): string {
  const words = title.split(/\s+/);
  const first = words[0];
  // Preserve all-caps acronyms (CNC, QC, etc.)
  if (/^[A-Z]{2,4}$/.test(first)) return first;
  // Otherwise: first 4 uppercase chars of the first word
  return first.slice(0, 4).toUpperCase();
}

function findExpiredCertTitle(userId: string, today: string): string | null {
  const expired = getCertifications().filter(
    (c) =>
      c.userId === userId &&
      c.expiresAt != null &&
      c.expiresAt.slice(0, 10) <= today
  );
  if (expired.length === 0) return null;
  // getCertifications() is sorted newest first; pick the first expired
  const proc = getProcedure(expired[0].procedureId);
  return proc?.title ?? null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Full morning-status snapshot: open verdict, station states, blockers. */
export function getMorningStatus(): MorningStatus {
  const all     = getTodayChecklists();
  const today   = demoToday();
  const userMap = new Map(getUsers().map((u) => [u.id, u.name]));
  const trainers = getUsersByRole("trainer");
  const escalateTo = trainers[0]?.name ?? "Shop owner";

  const total    = all.length;
  const complete = all.filter((c) => c.status === "complete").length;
  const inProg   = all.filter((c) => c.status === "in_progress" && !isBlockedCwr(c)).length;
  const blocked  = all.filter(isBlockedCwr).length;
  const pending  = all.filter((c) => c.status === "pending").length;
  const isOpen   = total > 0 && complete === total;

  // Shift countdown anchored to DEMO_NOW (not wall-clock — keeps demo deterministic)
  const todayStr   = demoToday();
  const shiftStart = new Date(
    `${todayStr}T${String(SHIFT_H).padStart(2, "0")}:${String(SHIFT_M).padStart(2, "0")}:00.000Z`
  );
  const initialSecondsRemaining = Math.max(
    0,
    Math.round((shiftStart.getTime() - DEMO_NOW.getTime()) / 1000)
  );

  const stations: StationState[] = all.map((cwr) => {
    const userId = cwr.run?.userId ?? "";
    const status: StationStatus = isBlockedCwr(cwr)
      ? "blocked"
      : cwr.status === "complete"
      ? "complete"
      : cwr.status === "in_progress"
      ? "in_progress"
      : "pending";
    return {
      checklistId:    cwr.checklist.id,
      title:          cwr.checklist.title,
      code:           stationCode(cwr.checklist.title),
      userId,
      userName:       userMap.get(userId) ?? "—",
      role:           cwr.checklist.role,
      status,
      completedCount: cwr.completedCount,
      totalCount:     cwr.totalCount,
      blockingReason: status === "blocked"
        ? (blockingItemLabelOf(cwr) ?? undefined)
        : undefined,
    };
  });

  const blockers: BlockerInfo[] = all
    .filter(isBlockedCwr)
    .map((cwr) => {
      const userId   = cwr.run?.userId ?? "";
      const userName = userMap.get(userId) ?? userId;
      return {
        checklistId:       cwr.checklist.id,
        checklistTitle:    cwr.checklist.title,
        userId,
        userName,
        blockingItemLabel: blockingItemLabelOf(cwr) ?? "",
        expiredCertTitle:  findExpiredCertTitle(userId, today) ?? undefined,
        escalateTo,
      };
    });

  return {
    isOpen,
    total,
    complete,
    inProgress: inProg,
    blocked,
    pending,
    stations,
    blockers,
    initialSecondsRemaining,
  };
}
