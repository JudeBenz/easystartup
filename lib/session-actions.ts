"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import type { Role } from "@/types/domain";
import { resetDemo } from "@/lib/store";
import { ROLE_COOKIE } from "@/lib/roles";

const RoleSchema = z.enum(["owner", "trainer", "employee"]);

/** Switch the active role (persona). Used by the top-nav role switcher. */
export async function setRole(role: Role): Promise<{ ok: boolean }> {
  try {
    const parsed = RoleSchema.safeParse(role);
    if (!parsed.success) return { ok: false };
    const store = await cookies();
    store.set(ROLE_COOKIE, parsed.data, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Restore the pristine seed between demo runs / judges. */
export async function resetDemoAction(): Promise<{ ok: boolean }> {
  try {
    resetDemo();
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
