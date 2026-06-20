"use server";

import { revalidatePath } from "next/cache";
import { recordAttempt, startAssignment } from "@/lib/store";
import { getActingUser } from "@/lib/session";

/** Mark an assignment in progress when the trainee begins (after the PPE gate). */
export async function startTraining(assignmentId?: string): Promise<void> {
  if (assignmentId) startAssignment(assignmentId);
  revalidatePath("/home");
}

export interface CompleteTrainingInput {
  procedureId: string;
  versionNumber: number;
  score: number;
  answers: Record<string, number>;
  startedAtIso: string;
  assignmentId?: string;
}

export interface CompleteTrainingResult {
  certificationId: string;
  issuedAt: string;
}

/**
 * Persist a completed training run: records the Attempt, upserts a
 * version-stamped Certification, and completes the assignment. The userId is
 * derived from the session — never trusted from the client.
 */
export async function completeTraining(
  input: CompleteTrainingInput
): Promise<CompleteTrainingResult> {
  const user = await getActingUser();
  const { certification } = recordAttempt({
    userId: user.id,
    procedureId: input.procedureId,
    versionNumber: input.versionNumber,
    score: input.score,
    answersJson: input.answers,
    startedAt: input.startedAtIso,
    assignmentId: input.assignmentId,
  });

  revalidatePath("/home");
  revalidatePath("/reports");
  revalidatePath("/people");
  revalidatePath(`/procedures/${input.procedureId}`);

  return {
    certificationId: certification.id,
    issuedAt: certification.issuedAt,
  };
}
