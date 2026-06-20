import type { Role } from "@/types/domain";

/** Client-safe role constants (no server-only imports). */
export const ROLE_COOKIE = "esu_role";

export const ROLES: Role[] = ["owner", "trainer", "employee"];

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  trainer: "Trainer",
  employee: "Employee",
};

export const ROLE_BLURB: Record<Role, string> = {
  owner: "See the whole operation — library, team, and autopilot.",
  trainer: "Author procedures and certify the team.",
  employee: "Train on what you're assigned and run your routines.",
};
