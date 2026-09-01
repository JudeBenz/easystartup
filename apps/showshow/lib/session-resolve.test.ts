import { describe, expect, it } from "vitest";
import { resolveSessionUser } from "./session-resolve";
import type { User } from "@/types/domain";

const aria: User = {
  id: "user_aria",
  name: "Aria Chen",
  email: "aria@example.com",
  roles: ["artist", "showgoer"],
  createdAt: "2026-01-01T00:00:00.000Z",
};

const sam: User = {
  id: "user_sam",
  name: "Sam Ortiz",
  email: "sam@example.com",
  roles: ["artist"],
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("resolveSessionUser", () => {
  it("returns the Auth.js profile when present", () => {
    const result = resolveSessionUser({
      authProfile: sam,
      demoEnabled: true,
      demoCookieUser: aria,
    });
    expect(result?.id).toBe("user_sam");
  });

  it("uses the demo cookie only when demo personas are explicitly enabled", () => {
    const result = resolveSessionUser({
      authProfile: null,
      demoEnabled: true,
      demoCookieUser: aria,
    });
    expect(result?.id).toBe("user_aria");
  });

  it("returns null when logged out and demo personas are off", () => {
    const result = resolveSessionUser({
      authProfile: null,
      demoEnabled: false,
      demoCookieUser: aria,
    });
    expect(result).toBeNull();
  });

  it("does not invent a default user when demo is on but no cookie matched", () => {
    const result = resolveSessionUser({
      authProfile: null,
      demoEnabled: true,
      demoCookieUser: null,
    });
    expect(result).toBeNull();
  });
});
