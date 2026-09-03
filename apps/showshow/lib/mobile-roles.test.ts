import { describe, expect, it } from "vitest";
import { rolesFromJoin } from "./mobile-roles";

describe("mobile join roles", () => {
  it("matches the website join form", () => {
    expect(rolesFromJoin("artist")).toEqual(["artist", "showgoer"]);
    expect(rolesFromJoin("director")).toEqual(["director", "showgoer"]);
    expect(rolesFromJoin("showgoer")).toEqual(["showgoer"]);
    expect(rolesFromJoin("")).toEqual(["artist", "showgoer"]);
  });
});
