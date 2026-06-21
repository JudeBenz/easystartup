"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dispatchJob, getJob, getUser } from "@/lib/store";

/**
 * Dispatch a crew + manager + workers to a job. The store's dispatchJob is the
 * cert-gate source of truth: any assigned worker missing a required cert flips
 * the job to `blocked`. This wrapper just resolves blocked ids → names for the
 * UI and revalidates the affected surfaces.
 */

const DispatchSchema = z.object({
  jobId: z.string().min(1),
  crewId: z.string().optional(),
  managerId: z.string().optional(),
  userIds: z.array(z.string()).default([]),
});

export type DispatchInput = z.input<typeof DispatchSchema>;

export type DispatchActionResult =
  | { ok: true; blocked: boolean; blockedNames: string[] }
  | { ok: false; error: string };

export async function dispatchJobAction(
  input: DispatchInput
): Promise<DispatchActionResult> {
  try {
    const data = DispatchSchema.parse(input);
    const result = dispatchJob(data.jobId, {
      crewId: data.crewId || undefined,
      managerId: data.managerId || undefined,
      userIds: data.userIds,
    });
    if (!result.job) return { ok: false, error: "Job not found." };

    const blockedNames = result.blockedUserIds.map(
      (id) => getUser(id)?.name ?? id
    );

    revalidatePath(`/jobs/${data.jobId}`);
    revalidatePath("/jobs");
    revalidatePath("/crews");
    if (data.crewId) revalidatePath(`/crews/${data.crewId}`);
    revalidatePath("/home");

    return { ok: true, blocked: !result.ok, blockedNames };
  } catch (e) {
    const error =
      e instanceof z.ZodError
        ? e.issues[0]?.message ?? "Please check the form."
        : e instanceof Error
          ? e.message
          : "Something went wrong.";
    return { ok: false, error };
  }
}
