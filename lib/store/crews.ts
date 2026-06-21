import type { Crew, User } from "@/types/domain";
import { db } from "./db";
import { getUser } from "./people";

/** Service-management: crews (a lead + members, optionally a truck). Reads only. */

export function getCrews(): Crew[] {
  return db().crews.slice();
}

export function getCrew(id: string): Crew | undefined {
  return db().crews.find((c) => c.id === id);
}

/** The crew a user belongs to (as lead or member), if any. */
export function getCrewForUser(userId: string): Crew | undefined {
  return db().crews.find(
    (c) => c.leadUserId === userId || c.memberUserIds.includes(userId)
  );
}

/** Resolved members of a crew (lead first, then the rest), skipping unknown ids. */
export function getCrewMembers(crewId: string): User[] {
  const crew = getCrew(crewId);
  if (!crew) return [];
  const ids = [
    crew.leadUserId,
    ...crew.memberUserIds.filter((id) => id !== crew.leadUserId),
  ];
  return ids
    .map((id) => getUser(id))
    .filter((u): u is User => u !== undefined);
}
