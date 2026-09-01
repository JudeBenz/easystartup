import { eq } from "drizzle-orm";
import { getPostgres, isPostgresEnabled } from "@/lib/db/client";
import { artists, users } from "@/lib/db/schema";
import type { User, UserRole } from "@/types/domain";

function mapUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    roles: (row.roles as UserRole[]) ?? [],
    createdAt: row.createdAt.toISOString(),
    avatarUrl: row.image ?? undefined,
    homeBase:
      row.homeLat && row.homeLng
        ? {
            lat: Number(row.homeLat),
            lng: Number(row.homeLng),
            label: row.homeLabel ?? "",
          }
        : undefined,
  };
}

/** Postgres-backed identity when DATABASE_URL is set. */
export async function pgListUsers(): Promise<User[] | null> {
  if (!isPostgresEnabled()) return null;
  const db = getPostgres()!;
  const rows = await db.select().from(users);
  return rows.map(mapUser);
}

export async function pgGetUser(id: string): Promise<User | null | undefined> {
  if (!isPostgresEnabled()) return undefined;
  const db = getPostgres()!;
  const row = await db.query.users.findFirst({ where: eq(users.id, id) });
  return row ? mapUser(row) : null;
}

export async function pgGetArtistIdForUser(
  userId: string,
): Promise<string | null | undefined> {
  if (!isPostgresEnabled()) return undefined;
  const db = getPostgres()!;
  const row = await db.query.artists.findFirst({
    where: eq(artists.userId, userId),
  });
  return row?.id ?? null;
}

export async function pgSetUserImage(userId: string, imageKey: string) {
  if (!isPostgresEnabled()) return;
  const db = getPostgres()!;
  await db
    .update(users)
    .set({ image: imageKey, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
