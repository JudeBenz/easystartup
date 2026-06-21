"use server";

import { revalidatePath } from "next/cache";
import { sendMessage } from "@/lib/store";
import { getRole, getActingUser } from "@/lib/session";
import type { MessageScope } from "@/types/domain";

export async function sendMessageAction(input: {
  scope: MessageScope;
  body: string;
  jobId?: string;
  isInstruction?: boolean;
}): Promise<void> {
  const trimmed = input.body.trim();
  if (!trimmed) return;

  const user = await getActingUser();

  sendMessage({
    fromUserId:    user.id,
    scope:         input.scope,
    body:          trimmed,
    jobId:         input.jobId,
    isInstruction: input.isInstruction,
  });

  revalidatePath("/messages");
  if (input.jobId) revalidatePath(`/jobs/${input.jobId}`);
}
