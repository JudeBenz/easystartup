import { cookies } from "next/headers";
import {
  getArtistIdForUser,
  getUser,
  listUsers as storeListUsers,
} from "@/lib/store";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import type { UserRole } from "@/types/domain";

export async function getSessionUser() {
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
