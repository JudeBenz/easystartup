import { nanoid } from "nanoid";
import { isPostgresEnabled, getPostgres } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";

export async function writeAudit(input: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Record<string, unknown>;
}) {
  if (!isPostgresEnabled()) return;
  const db = getPostgres()!;
  await db.insert(auditLog).values({
    id: `aud_${nanoid(10)}`,
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    meta: input.meta ?? {},
  });
}
