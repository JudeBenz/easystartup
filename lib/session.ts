import { cookies } from "next/headers";
import type { Role, User } from "@/types/domain";
import { EMPLOYEE_ID, getUser, OWNER_ID, TRAINER_ID } from "@/lib/store";
import { ROLE_COOKIE, ROLES } from "@/lib/roles";

/**
 * The demo has no real auth: one fixed user per role, selected by the role
 * switcher via a cookie. Server-only (reads next/headers cookies).
 * Role constants live in lib/roles.ts so client components can import them.
 */

const ROLE_USER: Record<Role, string> = {
  owner: OWNER_ID,
  trainer: TRAINER_ID,
  employee: EMPLOYEE_ID,
};

export async function getRole(): Promise<Role> {
  const store = await cookies();
  const value = store.get(ROLE_COOKIE)?.value as Role | undefined;
  return value && ROLES.includes(value) ? value : "owner";
}

/** The user currently acting in the app (persona for the active role). */
export async function getActingUser(): Promise<User> {
  const role = await getRole();
  const user = getUser(ROLE_USER[role]);
  // Fallback should never hit (personas are seeded), but keep types honest.
  return (
    user ?? {
      id: ROLE_USER[role],
      name: "Demo User",
      email: "demo@northgatefab.com",
    }
  );
}
