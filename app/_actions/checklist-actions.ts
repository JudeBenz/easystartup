"use server";

import { revalidatePath } from "next/cache";
import { toggleRunItem, getOrCreateRun, completeRun } from "@/lib/store";
import { getActingUser } from "@/lib/session";
import { demoToday } from "@/lib/store";

export async function toggleItemAction(
  runId: string,
  itemId: string,
  checklistId: string
): Promise<void> {
  toggleRunItem(runId, itemId);
  revalidatePath(`/checklists/${checklistId}/run`);
  revalidatePath("/autopilot");
  revalidatePath("/home");
}

export async function startRunAction(
  checklistId: string
): Promise<{ runId: string }> {
  const user = await getActingUser();
  const run = getOrCreateRun(checklistId, user.id, demoToday());
  revalidatePath(`/checklists/${checklistId}/run`);
  revalidatePath("/autopilot");
  revalidatePath("/home");
  return { runId: run.id };
}

export async function completeRunAction(
  runId: string,
  checklistId: string
): Promise<void> {
  completeRun(runId);
  revalidatePath(`/checklists/${checklistId}/run`);
  revalidatePath("/autopilot");
  revalidatePath("/home");
}
