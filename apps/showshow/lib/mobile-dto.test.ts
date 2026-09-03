import { describe, expect, it } from "vitest";
import { showDetail, showListItem, sortUpcoming } from "./mobile-dto";
import type { Show, ShowEdition } from "@/types/domain";

const show: Show = {
  id: "s1",
  slug: "cherry-creek-arts-festival",
  name: "Cherry Creek Arts Festival",
  officialWebsiteUrl: "https://www.cherryarts.org",
  primaryCity: "Denver",
  primaryRegion: "CO",
  country: "US",
  geo: { lat: 39.72, lng: -104.95 },
};

const edition: ShowEdition = {
  id: "e1",
  showId: "s1",
  year: 2026,
  startDate: "2026-07-03",
  endDate: "2026-07-05",
  applicationDeadline: "2026-02-01",
  venueName: "Cherry Creek North",
  fullAddress: "Denver, CO",
  geo: show.geo,
  boothFeeMin: 900,
  boothFeeMax: 1200,
  applicationFee: 40,
  currency: "USD",
  juryProcess: "panel",
  status: "upcoming",
};

describe("mobile show DTOs", () => {
  it("lists a show without inventing missing fees", () => {
    const item = showListItem({ show, current: { ...edition, boothFeeMin: undefined } });
    expect(item.boothFeeMin).toBeNull();
    expect(item.officialApplyUrl).toBe(show.officialWebsiteUrl);
    expect(item.city).toBe("Denver");
  });

  it("uses captured application pages for apply, not a guessed /apply path", () => {
    const detail = showDetail({
      show,
      current: edition,
      provenance: [
        {
          field: "applicationDeadline",
          sourceUrl: "https://www.cherryarts.org/artists",
        },
      ],
    });
    expect(detail.officialApplyUrl).toBe("https://www.cherryarts.org/artists");
    expect(detail.officialApplyUrl).not.toMatch(/\/apply$/);
  });

  it("sorts upcoming shows by start date", () => {
    const later = { show, current: edition };
    const earlier = {
      show: { ...show, id: "s2", name: "Earlier Fair", slug: "earlier" },
      current: { ...edition, id: "e2", startDate: "2026-04-01" },
    };
    expect(sortUpcoming([later, earlier]).map((r) => r.show.slug)).toEqual([
      "earlier",
      "cherry-creek-arts-festival",
    ]);
  });
});
