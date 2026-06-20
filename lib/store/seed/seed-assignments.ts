import type {
  Assignment,
  AssignmentStatus,
  Attempt,
  Certification,
} from "@/types/domain";
import {
  ASSEMBLER_ID,
  EMPLOYEE_ID,
  OWNER_ID,
  QC_ID,
  TRAINER_ID,
  WELDER_ID,
} from "./seed-people";
import { daysFrom, isoOn } from "./util";

export interface AssignmentsSeed {
  assignments: Assignment[];
  attempts: Attempt[];
  certifications: Certification[];
}

/**
 * Standalone safety/compliance certifications (issued outside in-app training).
 *
 * Compliance beat: EXACTLY 3 expired — two on Sarah (the CNC operator running
 * the cell right now), one on Derek (which blocks him at the welding bay). Every
 * other cert here is current, so all 6 people read as "trained".
 */
interface CertSpec {
  user: string;
  proc: string;
  version: number;
  issued: string;
  expires?: string;
}

const COMPLIANCE_CERTS: CertSpec[] = [
  // ── EXPIRED (the 3 flagged compliance issues) ──────────────────────────────
  // Sarah Chen (CNC operator) — two expired certs on the person running the CNC.
  { user: EMPLOYEE_ID, proc: "proc_loto", version: 1, issued: isoOn("2024-05-15"), expires: isoOn("2025-05-15") },
  { user: EMPLOYEE_ID, proc: "proc_cpr", version: 1, issued: isoOn("2023-09-20"), expires: isoOn("2025-09-20") },
  // Derek Foster (welder) — welding cert expired ~3 weeks ago; blocks the bay.
  { user: WELDER_ID, proc: "proc_welding_cert", version: 1, issued: isoOn("2025-05-30"), expires: isoOn("2026-05-30") },

  // ── CURRENT compliance certs ───────────────────────────────────────────────
  { user: OWNER_ID, proc: "proc_safety_mgr", version: 1, issued: isoOn("2025-12-01"), expires: isoOn("2026-12-01") },
  { user: OWNER_ID, proc: "proc_loto", version: 1, issued: isoOn("2025-11-10"), expires: isoOn("2026-11-10") },
  { user: TRAINER_ID, proc: "proc_cpr", version: 1, issued: isoOn("2025-10-01"), expires: isoOn("2027-10-01") },
  { user: QC_ID, proc: "proc_loto", version: 1, issued: isoOn("2026-01-10"), expires: isoOn("2027-01-10") },
];

interface Entry {
  user: string;
  proc: string;
  version: number;
  status: AssignmentStatus;
  assignedDaysAgo: number;
  dueInDays: number;
  assignedBy?: string;
  /** Present when the trainee passed: produces an Attempt + Certification. */
  passed?: {
    score: number;
    answers: Record<string, number>;
    daysAgo: number;
    /** Days until the cert expires (omit for non-expiring). */
    expiresInDays?: number;
  };
}

const TRAINING: Entry[] = [
  // Sarah — the LIVE Stage-1 training: assigned the CNC startup, not started yet.
  { user: EMPLOYEE_ID, proc: "proc_cnc_startup", version: 2, status: "not_started", assignedDaysAgo: -1, dueInDays: 1 },
  // A second open assignment so the demo can assign live to anyone.
  { user: QC_ID, proc: "proc_cnc_startup", version: 2, status: "not_started", assignedDaysAgo: -1, dueInDays: 2 },

  // Completed trainings -> attempts + valid certs (so all 6 read as trained).
  // Tom certified on the CNC startup at v1 while current is v2 (version drift).
  { user: ASSEMBLER_ID, proc: "proc_cnc_startup", version: 1, status: "completed", assignedDaysAgo: -30, dueInDays: -26, passed: { score: 100, answers: { proc_cnc_startup_s7: 0 }, daysAgo: -27, expiresInDays: 320 } },
  { user: ASSEMBLER_ID, proc: "proc_cnc_preop", version: 1, status: "completed", assignedDaysAgo: -28, dueInDays: -25, passed: { score: 100, answers: {}, daysAgo: -26 } },
  { user: EMPLOYEE_ID, proc: "proc_cnc_preop", version: 1, status: "completed", assignedDaysAgo: -25, dueInDays: -22, passed: { score: 100, answers: {}, daysAgo: -23 } },
  { user: WELDER_ID, proc: "proc_welding_setup", version: 1, status: "completed", assignedDaysAgo: -20, dueInDays: -16, passed: { score: 100, answers: { proc_welding_setup_s5: 0 }, daysAgo: -17 } },
  { user: WELDER_ID, proc: "proc_cnc_preop", version: 1, status: "completed", assignedDaysAgo: -24, dueInDays: -21, passed: { score: 80, answers: {}, daysAgo: -22 } },
  { user: QC_ID, proc: "proc_cnc_preop", version: 1, status: "completed", assignedDaysAgo: -18, dueInDays: -15, passed: { score: 100, answers: {}, daysAgo: -16 } },

  // In-progress + overdue for the manager's "needs attention" view.
  { user: ASSEMBLER_ID, proc: "proc_welding_setup", version: 1, status: "in_progress", assignedDaysAgo: -3, dueInDays: 4 },
  { user: WELDER_ID, proc: "proc_loto", version: 1, status: "overdue", assignedDaysAgo: -14, dueInDays: -4 },
  { user: QC_ID, proc: "proc_cpr", version: 1, status: "overdue", assignedDaysAgo: -12, dueInDays: -2 },
];

export function buildAssignments(): AssignmentsSeed {
  const assignments: Assignment[] = [];
  const attempts: Attempt[] = [];
  const certifications: Certification[] = [];

  COMPLIANCE_CERTS.forEach((c, i) => {
    certifications.push({
      id: `cert_c${i + 1}`,
      userId: c.user,
      procedureId: c.proc,
      versionNumber: c.version,
      issuedAt: c.issued,
      expiresAt: c.expires,
    });
  });

  TRAINING.forEach((e, i) => {
    const id = `asg_${i + 1}`;
    assignments.push({
      id,
      procedureId: e.proc,
      versionNumber: e.version,
      userId: e.user,
      assignedBy: e.assignedBy ?? TRAINER_ID,
      assignedAt: daysFrom(e.assignedDaysAgo),
      dueAt: daysFrom(e.dueInDays),
      status: e.status,
    });

    if (e.passed) {
      attempts.push({
        id: `att_t${i + 1}`,
        assignmentId: id,
        userId: e.user,
        procedureId: e.proc,
        versionNumber: e.version,
        startedAt: daysFrom(e.passed.daysAgo, -1),
        completedAt: daysFrom(e.passed.daysAgo),
        score: e.passed.score,
        answersJson: e.passed.answers,
      });
      certifications.push({
        id: `cert_t${i + 1}`,
        userId: e.user,
        procedureId: e.proc,
        versionNumber: e.version,
        issuedAt: daysFrom(e.passed.daysAgo),
        expiresAt:
          e.passed.expiresInDays !== undefined
            ? daysFrom(e.passed.expiresInDays)
            : undefined,
      });
    }
  });

  return { assignments, attempts, certifications };
}
