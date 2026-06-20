"use server";

import { revalidatePath } from "next/cache";
import { assignProcedure } from "@/lib/store";
import { getActingUser } from "@/lib/session";

export interface AssignInput {
  procedureId: string;
  userIds: string[];
  /** YYYY-MM-DD from the date picker. */
  dueDate: string;
}

/** Assign a procedure to employees with a due date. Returns how many were new. */
export async function assignProcedureAction(
  input: AssignInput
): Promise<{ count: number }> {
  const user = await getActingUser();
  const dueAt = new Date(`${input.dueDate}T17:00:00.000Z`).toISOString();

  const created = assignProcedure({
    procedureId: input.procedureId,
    userIds: input.userIds,
    assignedBy: user.id,
    dueAt,
  });

  revalidatePath(`/procedures/${input.procedureId}`);
  revalidatePath("/home");
  revalidatePath("/people");
  return { count: created.length };
}
