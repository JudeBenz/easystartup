"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAttempt, startAssignment } from "@/lib/store";
import { getActingUser } from "@/lib/session";

/** Mark an assignment in progress when the trainee begins (after the PPE gate). */
export async function startTraining(
  assignmentId?: string
): Promise<{ ok: boolean }> {
  try {
    const parsed = z.string().min(1).optional().safeParse(assignmentId);
    if (!parsed.success) return { ok: false };
    if (parsed.data) startAssignment(parsed.data);
    revalidatePath("/home");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export interface CompleteTrainingInput {
  procedureId: string;
  versionNumber: number;
  score: number;
  answers: Record<string, number>;
  startedAtIso: string;
  assignmentId?: string;
}

const CompleteSchema = z.object({
  procedureId: z.string().min(1),
  versionNumber: z.number().int().nonnegative(),
  score: z.number().min(0).max(100),
  answers: z.record(z.string(), z.number()),
  startedAtIso: z.string().min(1),
  assignmentId: z.string().optional(),
});

export type CompleteTrainingResult =
  | { ok: true; certificationId: string; issuedAt: string }
  | { ok: false; error: string };

/**
 * Persist a completed training run: records the Attempt, upserts a
 * version-stamped Certification, and completes the assignment. The userId is
 * derived from the session — never trusted from the client. This is on the live
 * demo's critical line, so it never throws — it returns a typed result.
 */
export async function completeTraining(
  input: CompleteTrainingInput
): Promise<CompleteTrainingResult> {
  try {
    const parsed = CompleteSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Invalid training result." };
    }
    const data = parsed.data;
    const user = await getActingUser();

    const { certification } = recordAttempt({
      userId: user.id,
      procedureId: data.procedureId,
      versionNumber: data.versionNumber,
      score: data.score,
      answersJson: data.answers,
      startedAt: data.startedAtIso,
      assignmentId: data.assignmentId,
    });

    revalidatePath("/home");
    revalidatePath("/reports");
    revalidatePath("/people");
    revalidatePath(`/procedures/${data.procedureId}`);

    return {
      ok: true,
      certificationId: certification.id,
      issuedAt: certification.issuedAt,
    };
  } catch {
    return { ok: false, error: "Couldn't record the attempt." };
  }
}
