import type { Assignment, AssignmentStatus } from "@/types/domain";
import { db, newId, save } from "./db";
import { getProcedure } from "./procedures";

/** Builder A owns this module. Assignments: assign, query, status. */

function nowIso(): string {
  return new Date().toISOString();
}

// ---- reads -----------------------------------------------------------------

export function getAllAssignments(): Assignment[] {
  return db()
    .assignments.slice()
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

export function getAssignment(id: string): Assignment | undefined {
  return db().assignments.find((a) => a.id === id);
}

export function getAssignmentsForUser(userId: string): Assignment[] {
  return getAllAssignments().filter((a) => a.userId === userId);
}

export function getAssignmentsForProcedure(procedureId: string): Assignment[] {
  return getAllAssignments().filter((a) => a.procedureId === procedureId);
}

export function getActiveAssignment(
  userId: string,
  procedureId: string
): Assignment | undefined {
  return db().assignments.find(
    (a) =>
      a.userId === userId &&
      a.procedureId === procedureId &&
      a.status !== "completed"
  );
}

/** True if a due date is in the past (used to surface overdue work). */
export function isOverdue(assignment: Assignment): boolean {
  return (
    assignment.status !== "completed" &&
    assignment.dueAt < nowIso()
  );
}

// ---- mutations -------------------------------------------------------------

export interface AssignProcedureInput {
  procedureId: string;
  userIds: string[];
  assignedBy: string;
  dueAt: string;
  /** Defaults to the procedure's current published version. */
  versionNumber?: number;
}

/**
 * Assign a procedure to one or more employees. Skips users who already have an
 * open (non-completed) assignment for this procedure. Returns the new ones.
 */
export function assignProcedure(input: AssignProcedureInput): Assignment[] {
  const proc = getProcedure(input.procedureId);
  const versionNumber =
    input.versionNumber ?? proc?.currentVersion ?? 1;

  const created: Assignment[] = [];
  for (const userId of input.userIds) {
    if (getActiveAssignment(userId, input.procedureId)) continue;
    const assignment: Assignment = {
      id: newId("asg"),
      procedureId: input.procedureId,
      versionNumber,
      userId,
      assignedBy: input.assignedBy,
      assignedAt: nowIso(),
      dueAt: input.dueAt,
      status: "not_started",
    };
    db().assignments.push(assignment);
    created.push(assignment);
  }
  save();
  return created;
}

export function updateAssignmentStatus(
  id: string,
  status: AssignmentStatus
): Assignment | undefined {
  const assignment = getAssignment(id);
  if (!assignment) return undefined;
  assignment.status = status;
  save();
  return assignment;
}

/** Mark an assignment in progress when a trainee opens the player. */
export function startAssignment(id: string): Assignment | undefined {
  const assignment = getAssignment(id);
  if (!assignment || assignment.status === "completed") return assignment;
  if (assignment.status === "not_started") {
    assignment.status = "in_progress";
    save();
  }
  return assignment;
}
