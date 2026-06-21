"use server";

import { assignProcedure, demoToday } from "@/lib/store";
import { OWNER_ID } from "@/lib/store/seed/seed-people";
import { revalidatePath } from "next/cache";

/** Assign a procedure to a person from the training matrix (due in 7 days). */
export async function matrixAssignAction(
  userId: string,
  procedureId: string
): Promise<void> {
  const today   = demoToday();
  const dueDate = new Date(today + "T00:00:00Z");
  dueDate.setUTCDate(dueDate.getUTCDate() + 7);

  assignProcedure({
    procedureId,
    userIds:    [userId],
    assignedBy: OWNER_ID,
    dueAt:      dueDate.toISOString(),
  });

  revalidatePath("/people");
  revalidatePath(`/people/${userId}`);
}
