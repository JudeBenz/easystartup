"use server";

import { assignProcedure, demoToday } from "@/lib/store";
import { OWNER_ID } from "@/lib/store/seed/seed-people";
import { revalidatePath } from "next/cache";

/**
 * Re-assign a procedure as a recertification for the given user.
 * Due in 7 days from the demo date. Skips if an open assignment already exists
 * (assignProcedure's built-in guard).
 */
export async function recertAction(
  userId: string,
  procedureId: string
): Promise<void> {
  const today = demoToday();
  const dueDate = new Date(today + "T00:00:00Z");
  dueDate.setUTCDate(dueDate.getUTCDate() + 7);

  assignProcedure({
    procedureId,
    userIds:    [userId],
    assignedBy: OWNER_ID,
    dueAt:      dueDate.toISOString(),
  });

  revalidatePath("/reports/compliance");
  revalidatePath("/reports");
  revalidatePath("/autopilot");
  revalidatePath("/people");
}
