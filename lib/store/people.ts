import type { Membership, Organization, Role, User } from "@/types/domain";
import { db } from "./db";

/** Shared people/org reads (foundation). Used by every page for name lookups. */

export function getOrg(): Organization {
  return db().organizations[0];
}

export function getUsers(): User[] {
  return db().users.slice();
}

export function getUser(id: string): User | undefined {
  return db().users.find((u) => u.id === id);
}

export function getMemberships(): Membership[] {
  return db().memberships.slice();
}

export function getRoleOf(userId: string): Role | undefined {
  return db().memberships.find((m) => m.userId === userId)?.role;
}

export function getUsersByRole(role: Role): User[] {
  const ids = new Set(
    db().memberships.filter((m) => m.role === role).map((m) => m.userId)
  );
  return getUsers().filter((u) => ids.has(u.id));
}

export function getEmployees(): User[] {
  return getUsersByRole("employee");
}

// initialsOf lives in lib/utils (client-safe); re-exported for server callers.
export { initialsOf } from "@/lib/utils";
