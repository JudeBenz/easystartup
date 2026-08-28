import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import {
  getArtistIdForUser,
  getUser,
  listUsers as storeListUsers,
} from "@/lib/store";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import type { User, UserRole } from "@/types/domain";

/**
 * Session resolution order:
 * 1. Auth.js JWT (production)
 * 2. Demo persona cookie (SHOWSHOW_DEMO_PERSONAS=1 or no Auth session)
 */
export async function getSessionUser(): Promise<User> {
  const session = await auth();
  if (session?.user?.id) {
    const fromStore = await getUser(session.user.id);
    if (fromStore) {
      return {
        ...fromStore,
        roles: session.user.roles?.length ? session.user.roles : fromStore.roles,
      };
    }
    return {
      id: session.user.id,
      name: session.user.name ?? "User",
      email: session.user.email ?? "",
      roles: session.user.roles ?? [],
      createdAt: new Date().toISOString(),
    };
  }

  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value ?? "user_aria";
  const user = await getUser(id);
  if (user) return user;
  const users = await storeListUsers();
  return users[0];
}

export async function listUsers() {
  return storeListUsers();
}

export async function getSessionArtistId() {
  const user = await getSessionUser();
  if (!user.roles.includes("artist")) return null;
  return getArtistIdForUser(user.id);
}

export async function sessionHasRole(role: UserRole) {
  const user = await getSessionUser();
  return user.roles.includes(role);
}
