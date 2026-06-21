"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assignProcedure } from "@/lib/store";
import { getActingUser } from "@/lib/session";

export interface AssignInput {
  procedureId: string;
  userIds: string[];
  /** YYYY-MM-DD from the date picker. */
  dueDate: string;
}

const AssignSchema = z.object({
  procedureId: z.string().min(1),
  userIds: z.array(z.string().min(1)).min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid due date."),
});

export type AssignResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

/** Assign a procedure to employees with a due date. Returns how many were new. */
export async function assignProcedureAction(
  input: AssignInput
): Promise<AssignResult> {
  try {
    const parsed = AssignSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid assignment.",
      };
    }
    const { procedureId, userIds, dueDate } = parsed.data;
    const user = await getActingUser();
    const dueAt = new Date(`${dueDate}T17:00:00.000Z`).toISOString();

    const created = assignProcedure({
      procedureId,
      userIds,
      assignedBy: user.id,
      dueAt,
    });

    revalidatePath(`/procedures/${procedureId}`);
    revalidatePath("/home");
    revalidatePath("/people");
    return { ok: true, count: created.length };
  } catch {
    return { ok: false, error: "Couldn't assign training. Please try again." };
  }
}
