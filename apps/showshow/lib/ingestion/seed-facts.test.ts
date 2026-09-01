import { describe, expect, it } from "vitest";
import { SEED_OFFICIAL_FACTS, SEED_PRIOR_YEAR_FACTS } from "./seed-facts";

describe("seed facts honesty", () => {
  it("does not invent festival-grounds venues", () => {
    const invented = SEED_OFFICIAL_FACTS.filter((f) =>
      f.venueName.toLowerCase().includes("festival grounds"),
    );
    expect(invented).toEqual([]);
  });

  it("maps capture jury process to the allowed enum", () => {
    const allowed = new Set(["blind", "panel", "invitation", "open", "unknown"]);
    for (const f of SEED_OFFICIAL_FACTS) {
      expect(allowed.has(f.juryProcess)).toBe(true);
    }
  });

  it("does not fabricate prior-year fees or attendance", () => {
    for (const f of SEED_PRIOR_YEAR_FACTS) {
      expect(f.boothFeeMin).toBeUndefined();
      expect(f.boothFeeMax).toBeUndefined();
      expect(f.attendance).toBeUndefined();
    }
  });
});
