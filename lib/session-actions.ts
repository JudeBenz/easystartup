"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { Role } from "@/types/domain";
import { resetDemo } from "@/lib/store";
import { ROLE_COOKIE, ROLES } from "@/lib/roles";

/** Switch the active role (persona). Used by the top-nav role switcher. */
export async function setRole(role: Role): Promise<void> {
  if (!ROLES.includes(role)) return;
  const store = await cookies();
  store.set(ROLE_COOKIE, role, { path: "/", maxAge: 60 * 60 * 24 * 7 });
  revalidatePath("/", "layout");
}

/** Restore the pristine seed between demo runs / judges. */
export async function resetDemoAction(): Promise<void> {
  resetDemo();
  revalidatePath("/", "layout");
}
