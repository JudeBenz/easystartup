import type { User } from "@/types/domain";

export function resolveSessionUser(input: {
  authProfile: User | null;
  demoEnabled: boolean;
  demoCookieUser: User | null;
}): User | null {
  if (input.authProfile) return input.authProfile;
  if (input.demoEnabled && input.demoCookieUser) return input.demoCookieUser;
  return null;
}
