import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getArtistIdForUser, getUser } from "@/lib/store";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { isDemoPersonasEnabled } from "@/lib/demo-mode";
import { resolveSessionUser } from "@/lib/session-resolve";
import type { User, UserRole } from "@/types/domain";

/**
 * Session resolution:
 * 1. Auth.js JWT
 * 2. Demo persona cookie, only when SHOWSHOW_DEMO_PERSONAS=1
 * 3. Otherwise null (logged out)
 */
export async function getSessionUser(): Promise<User | null> {
  const session = await auth();
  let authProfile: User | null = null;
  if (session?.user?.id) {
    const fromStore = await getUser(session.user.id);
    if (fromStore) {
      authProfile = {
        ...fromStore,
        roles: session.user.roles?.length ? session.user.roles : fromStore.roles,
      };
    } else {
      authProfile = {
        id: session.user.id,
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        roles: session.user.roles ?? [],
        createdAt: new Date().toISOString(),
      };
    }
  }

  const jar = await cookies();
  const demoId = jar.get(SESSION_COOKIE)?.value;
  const demoCookieUser = demoId ? ((await getUser(demoId)) ?? null) : null;

  return resolveSessionUser({
    authProfile,
    demoEnabled: isDemoPersonasEnabled(),
    demoCookieUser,
  });
}

export async function listUsers() {
  const { listUsers: storeListUsers } = await import("@/lib/store");
  return storeListUsers();
}

export async function getSessionArtistId() {
  const user = await getSessionUser();
  if (!user?.roles.includes("artist")) return null;
  return getArtistIdForUser(user.id);
}

export async function sessionHasRole(role: UserRole) {
  const user = await getSessionUser();
  return Boolean(user?.roles.includes(role));
}
