import type { Attempt, Certification } from "@/types/domain";
import { db, newId, save } from "./db";

/** Builder A owns this module. Attempts + certifications (the "proof"). */

function nowIso(): string {
  return new Date().toISOString();
}

function plusDaysIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

// ---- reads -----------------------------------------------------------------

export function getAttempts(): Attempt[] {
  return db().attempts.slice();
}

export function getAttemptsForUser(userId: string): Attempt[] {
  return db().attempts.filter((a) => a.userId === userId);
}

export function getCertifications(): Certification[] {
  return db()
    .certifications.slice()
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export function getCertificationsForUser(userId: string): Certification[] {
  return getCertifications().filter((c) => c.userId === userId);
}

export function getCertificationsForProcedure(
  procedureId: string
): Certification[] {
  return getCertifications().filter((c) => c.procedureId === procedureId);
}

export function getCertification(
  userId: string,
  procedureId: string
): Certification | undefined {
  return db().certifications.find(
    (c) => c.userId === userId && c.procedureId === procedureId
  );
}

/** Look up a certification by its own id (used by the public /verify page). */
export function getCertificationById(id: string): Certification | undefined {
  return db().certifications.find((c) => c.id === id);
}

// ---- mutations -------------------------------------------------------------

export interface RecordAttemptInput {
  userId: string;
  procedureId: string;
  versionNumber: number;
  score: number;
  answersJson: Record<string, number>;
  startedAt?: string;
  assignmentId?: string;
  /** Days until the issued cert expires (default 365; null = non-expiring). */
  expiresInDays?: number | null;
}

export interface RecordAttemptResult {
  attempt: Attempt;
  certification: Certification;
}

/**
 * Record a completed training run: store the Attempt, upsert a version-stamped
 * Certification, and mark the matching assignment completed. Returns both.
 */
export function recordAttempt(input: RecordAttemptInput): RecordAttemptResult {
  const data = db();
  const completedAt = nowIso();

  const attempt: Attempt = {
    id: newId("att"),
    assignmentId: input.assignmentId,
    userId: input.userId,
    procedureId: input.procedureId,
    versionNumber: input.versionNumber,
    startedAt: input.startedAt ?? completedAt,
    completedAt,
    score: input.score,
    answersJson: input.answersJson,
  };
  data.attempts.push(attempt);

  const expiresAt =
    input.expiresInDays === null
      ? undefined
      : plusDaysIso(input.expiresInDays ?? 365);

  let certification = getCertification(input.userId, input.procedureId);
  if (certification) {
    certification.versionNumber = input.versionNumber;
    certification.issuedAt = completedAt;
    certification.expiresAt = expiresAt;
  } else {
    certification = {
      id: newId("cert"),
      userId: input.userId,
      procedureId: input.procedureId,
      versionNumber: input.versionNumber,
      issuedAt: completedAt,
      expiresAt,
    };
    data.certifications.push(certification);
  }

  // Complete the matching assignment.
  const assignment = input.assignmentId
    ? data.assignments.find((a) => a.id === input.assignmentId)
    : data.assignments.find(
        (a) =>
          a.userId === input.userId &&
          a.procedureId === input.procedureId &&
          a.status !== "completed"
      );
  if (assignment) assignment.status = "completed";

  save();
  return { attempt, certification };
}
