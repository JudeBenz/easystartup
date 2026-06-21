"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createJob, createJobType } from "@/lib/store";

/**
 * Service-management write surface (job types + jobs). Validation mirrors the
 * client editors; every action is wrapped so a bad input returns a typed
 * { ok:false, error } instead of throwing into the UI.
 */

const ChecklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, "Each checklist item needs a label"),
  required: z.boolean(),
  type: z.enum(["task", "ppe", "warning"]),
});

const JobTypeInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1).default("General"),
  kind: z.enum(["in_house", "field"]),
  procedureIds: z.array(z.string()).default([]),
  checklistTemplate: z.array(ChecklistItemSchema).default([]),
  requiredCertProcedureIds: z.array(z.string()).default([]),
  ppe: z.array(z.string()).default([]),
  estDurationMin: z.number().int().min(0).max(1440).default(60),
});

export type JobTypeInput = z.input<typeof JobTypeInputSchema>;

const JobInputSchema = z.object({
  jobTypeId: z.string().min(1, "Pick a job type"),
  title: z.string().min(1, "Title is required"),
  scheduledAt: z.string().min(1, "Pick a date and time"),
  siteId: z.string().optional(),
  crewId: z.string().optional(),
  managerId: z.string().optional(),
  assignedUserIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export type JobInput = z.input<typeof JobInputSchema>;

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function messageOf(e: unknown): string {
  if (e instanceof z.ZodError) {
    return e.issues[0]?.message ?? "Please check the form.";
  }
  return e instanceof Error ? e.message : "Something went wrong.";
}

export async function createJobTypeAction(
  input: JobTypeInput
): Promise<ActionResult> {
  try {
    const data = JobTypeInputSchema.parse(input);
    const jobType = createJobType(data);
    revalidatePath("/job-types");
    revalidatePath("/jobs/new");
    return { ok: true, id: jobType.id };
  } catch (e) {
    return { ok: false, error: messageOf(e) };
  }
}

export async function createJobAction(input: JobInput): Promise<ActionResult> {
  try {
    const data = JobInputSchema.parse(input);
    // Empty optional ids come through as "" from <select> — normalize to undefined.
    const job = createJob({
      ...data,
      siteId: data.siteId || undefined,
      crewId: data.crewId || undefined,
      managerId: data.managerId || undefined,
    });
    revalidatePath("/jobs");
    revalidatePath("/home");
    return { ok: true, id: job.id };
  } catch (e) {
    return { ok: false, error: messageOf(e) };
  }
}
