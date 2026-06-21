"use server";

import { revalidatePath } from "next/cache";
import { db, save } from "@/lib/store/db";
import { addJobProof, completeJob } from "@/lib/store";
import { getActingUser } from "@/lib/session";

/** Toggle a checklist item on a job's run (identified by runId). */
export async function toggleJobRunItemAction(
  runId:  string,
  itemId: string
): Promise<void> {
  const run = db().checklistRuns.find((r) => r.id === runId);
  if (!run) return;

  if (run.completedItemIds.includes(itemId)) {
    run.completedItemIds = run.completedItemIds.filter((id) => id !== itemId);
  } else {
    run.completedItemIds.push(itemId);
  }

  // Derive run status from the job's jobType template
  const job = db().jobs.find((j) => j.checklistRunId === runId);
  if (job) {
    const jt = db().jobTypes.find((t) => t.id === job.jobTypeId);
    if (jt) {
      const required = jt.checklistTemplate
        .filter((i) => i.required)
        .map((i) => i.id);
      const allDone = required.every((id) => run.completedItemIds.includes(id));
      run.status = run.completedItemIds.length === 0
        ? "pending"
        : allDone
        ? "complete"
        : "in_progress";
    }
  }

  save();
  revalidatePath(`/jobs/${job?.id ?? ""}`);
  revalidatePath("/operations");
}

/** Attach a proof photo (data URL or external URL) to a job. */
export async function addJobProofAction(
  jobId:    string,
  mediaUrl: string
): Promise<void> {
  if (!mediaUrl) return;
  addJobProof(jobId, mediaUrl);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/operations");
}

/** Mark a job complete; stamps completedAt and completes its checklist run. */
export async function completeJobAction(jobId: string): Promise<void> {
  const actor = await getActingUser();
  const job = db().jobs.find((j) => j.id === jobId);
  if (!job) return;

  // Gate: user must be assigned or managing
  const allowed =
    job.assignedUserIds.includes(actor.id) || job.managerId === actor.id;
  if (!allowed) return;

  completeJob(jobId);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/operations");
  revalidatePath("/home");
}
