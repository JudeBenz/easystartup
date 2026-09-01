import { eq } from "drizzle-orm";
import { getPostgres, isPostgresEnabled } from "@/lib/db/client";
import { directors } from "@/lib/db/schema";
import { getArtistIdForUser } from "@/lib/store";
import type { UserRole } from "@/types/domain";

/** Authenticated user. Throws when nobody is signed in. */
export async function requireSessionUser() {
  const { getSessionUser } = await import("@/lib/session-data");
  const user = await getSessionUser();
  if (!user) throw new Error("Sign in required");
  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireSessionUser();
  if (!user.roles.includes(role) && !user.roles.includes("admin")) {
    throw new Error(`Requires ${role} role`);
  }
  return user;
}

export async function requireArtistId(userId?: string) {
  const user = await requireSessionUser();
  if (userId && userId !== user.id && !user.roles.includes("admin")) {
    throw new Error("Not authorized");
  }
  const artistId = await getArtistIdForUser(user.id);
  if (!artistId) throw new Error("Artist profile required");
  return { user, artistId };
}

export async function requireArtistOwner(artistId: string) {
  const { user, artistId: mine } = await requireArtistId();
  if (artistId !== mine && !user.roles.includes("admin")) {
    throw new Error("Not your artist profile");
  }
  return { user, artistId: mine };
}

export async function requireVerifiedDirector(userId?: string) {
  const user = await requireRole("director");
  if (userId && userId !== user.id && !user.roles.includes("admin")) {
    throw new Error("Not authorized");
  }
  if (!isPostgresEnabled()) return user;

  const db = getPostgres()!;
  const director = await db.query.directors.findFirst({
    where: eq(directors.userId, user.id),
  });
  if (!director) throw new Error("Director profile required");
  if (!director.verified && !user.roles.includes("admin")) {
    throw new Error("Director verification pending — promotions and announcements unlock after verify");
  }
  return user;
}

export async function requireAdmin() {
  return requireRole("admin");
}
