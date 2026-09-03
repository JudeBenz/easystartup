import type { UserRole } from "@/types/domain";

export function rolesFromJoin(role: string): UserRole[] {
  if (role === "director") return ["director", "showgoer"];
  if (role === "showgoer") return ["showgoer"];
  return ["artist", "showgoer"];
}
