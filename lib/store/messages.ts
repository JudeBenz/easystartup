import type { Message, MessageScope } from "@/types/domain";
import { db, newId, save } from "./db";
import { getCrewForUser } from "./crews";
import { ORG_ID } from "./seed/seed-people";

/**
 * Service-management: messages — broadcasts, crew notes, direct messages, and
 * per-job threads. Instructions (`isInstruction`) are directives surfaced
 * differently in the UI.
 */

function byCreatedAt(a: Message, b: Message): number {
  return a.createdAt.localeCompare(b.createdAt);
}

// ---- reads -----------------------------------------------------------------

/** All messages, or those matching an exact scope (type + optional id). */
export function getMessages(scope?: MessageScope): Message[] {
  const all = db().messages.slice().sort(byCreatedAt);
  if (!scope) return all;
  return all.filter(
    (m) => m.scope.type === scope.type && m.scope.id === scope.id
  );
}

/** Messages visible to a user: broadcasts, their crew's, and direct-to-them. */
export function getMessagesForUser(userId: string): Message[] {
  const crew = getCrewForUser(userId);
  return db()
    .messages.filter((m) => {
      switch (m.scope.type) {
        case "all":
          return true;
        case "crew":
          return crew !== undefined && m.scope.id === crew.id;
        case "user":
          return m.scope.id === userId || m.fromUserId === userId;
        case "job":
          return false; // job threads are read via getJobThread
      }
    })
    .sort(byCreatedAt);
}

/** The message thread for a job (scoped to it or tagged with its jobId). */
export function getJobThread(jobId: string): Message[] {
  return db()
    .messages.filter(
      (m) =>
        m.jobId === jobId ||
        (m.scope.type === "job" && m.scope.id === jobId)
    )
    .sort(byCreatedAt);
}

// ---- mutations -------------------------------------------------------------

export interface SendMessageInput {
  fromUserId: string;
  scope: MessageScope;
  body: string;
  jobId?: string;
  isInstruction?: boolean;
  orgId?: string;
}

export function sendMessage(input: SendMessageInput): Message {
  // A job-scoped message implicitly carries its jobId for thread lookups.
  const jobId =
    input.jobId ?? (input.scope.type === "job" ? input.scope.id : undefined);
  const message: Message = {
    id: newId("msg"),
    orgId: input.orgId ?? ORG_ID,
    fromUserId: input.fromUserId,
    scope: input.scope,
    body: input.body,
    createdAt: new Date().toISOString(),
    jobId,
    isInstruction: input.isInstruction,
  };
  db().messages.push(message);
  save();
  return message;
}
