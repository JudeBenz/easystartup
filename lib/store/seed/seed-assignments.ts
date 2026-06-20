import type {
  Assignment,
  AssignmentStatus,
  Attempt,
  Certification,
} from "@/types/domain";
import { OWNER_ID, TRAINER_ID } from "./seed-people";
import { daysFrom } from "./util";

export interface AssignmentsSeed {
  assignments: Assignment[];
  attempts: Attempt[];
  certifications: Certification[];
}

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

const ENTRIES: Entry[] = [
  // Sam Ortiz (the demo employee) — one fresh laser assignment to train live.
  { user: "user_employee", proc: "proc_laser", version: 2, status: "not_started", assignedDaysAgo: -1, dueInDays: 2 },
  { user: "user_employee", proc: "proc_booth", version: 1, status: "completed", assignedDaysAgo: -20, dueInDays: -16, passed: { score: 100, answers: { proc_booth_s4: 0 }, daysAgo: -17, expiresInDays: 348 } },
  { user: "user_employee", proc: "proc_open", version: 1, status: "completed", assignedDaysAgo: -25, dueInDays: -23, passed: { score: 100, answers: {}, daysAgo: -24 } },

  // Dana Cole — certified on the laser at v1 (now v2: a recert story), plus an overdue.
  { user: "user_emp2", proc: "proc_laser", version: 1, status: "completed", assignedDaysAgo: -35, dueInDays: -30, passed: { score: 80, answers: { proc_laser_s7: 0 }, daysAgo: -31, expiresInDays: 334 } },
  { user: "user_emp2", proc: "proc_vinyl", version: 1, status: "in_progress", assignedDaysAgo: -2, dueInDays: 3 },
  { user: "user_emp2", proc: "proc_qa", version: 1, status: "overdue", assignedDaysAgo: -10, dueInDays: -2 },

  // Luis Park
  { user: "user_emp3", proc: "proc_open", version: 1, status: "completed", assignedDaysAgo: -25, dueInDays: -23, passed: { score: 100, answers: {}, daysAgo: -24 } },
  { user: "user_emp3", proc: "proc_maint", version: 1, status: "not_started", assignedDaysAgo: -1, dueInDays: 1 },
  { user: "user_emp3", proc: "proc_booth", version: 1, status: "overdue", assignedDaysAgo: -12, dueInDays: -3 },

  // Tess Nguyen
  { user: "user_emp4", proc: "proc_vinyl", version: 1, status: "completed", assignedDaysAgo: -15, dueInDays: -12, passed: { score: 100, answers: { proc_vinyl_s4: 0 }, daysAgo: -13 } },
  { user: "user_emp4", proc: "proc_close", version: 1, status: "not_started", assignedDaysAgo: -1, dueInDays: 4 },

  // Priya Anand
  { user: "user_emp5", proc: "proc_qa", version: 1, status: "completed", assignedDaysAgo: -14, dueInDays: -11, passed: { score: 100, answers: {}, daysAgo: -12 } },
  { user: "user_emp5", proc: "proc_laser", version: 2, status: "not_started", assignedDaysAgo: -1, dueInDays: 2 },
];

export function buildAssignments(): AssignmentsSeed {
  const assignments: Assignment[] = [];
  const attempts: Attempt[] = [];
  const certifications: Certification[] = [];

  ENTRIES.forEach((e, i) => {
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
      const startedAt = daysFrom(e.passed.daysAgo, -1);
      const completedAt = daysFrom(e.passed.daysAgo);
      attempts.push({
        id: `att_${i + 1}`,
        assignmentId: id,
        userId: e.user,
        procedureId: e.proc,
        versionNumber: e.version,
        startedAt,
        completedAt,
        score: e.passed.score,
        answersJson: e.passed.answers,
      });
      certifications.push({
        id: `cert_${i + 1}`,
        userId: e.user,
        procedureId: e.proc,
        versionNumber: e.version,
        issuedAt: completedAt,
        expiresAt:
          e.passed.expiresInDays !== undefined
            ? daysFrom(e.passed.expiresInDays)
            : undefined,
      });
    }
  });

  return { assignments, attempts, certifications };
}

// Referenced so seed authoring intent (owner can also assign) stays linted-clean.
export const SEED_ASSIGNERS = [OWNER_ID, TRAINER_ID];
