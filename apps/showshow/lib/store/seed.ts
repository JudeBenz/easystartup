import { nanoid } from "nanoid";
import type {
  ArtistProfile,
  DemoData,
  Medium,
  ShowAggregateMetric,
  User,
} from "@/types/domain";
import { ManualFactAdapter } from "@/lib/ingestion/manual";
import { ALL_SEED_FACTS } from "@/lib/ingestion/seed-facts";

const MEDIUMS: Medium[] = [
  "ceramics",
  "oil_painting",
  "watercolor",
  "jewelry",
  "sculpture",
  "photography",
  "fiber",
  "glass",
  "printmaking",
  "mixed_media",
  "drawing",
  "wood",
];

export async function buildSeed(): Promise<DemoData> {
  const adapter = new ManualFactAdapter(
    ALL_SEED_FACTS.map((f) => ({
      ...f,
      adapterId: "manual-v1",
      sourceKind: "manual" as const,
    })),
  );
  const facts = await adapter.fetchFacts();
  const now = "2026-01-01T12:00:00.000Z";

  const showsMap = new Map<string, DemoData["shows"][0]>();
  const editions: DemoData["editions"] = [];
  const socialLinks: DemoData["socialLinks"] = [];
  const externalRefs: DemoData["externalRefs"] = [];
  const provenance: DemoData["provenance"] = [];

  for (const fact of facts) {
    let show = showsMap.get(fact.showSlug);
    if (!show) {
      show = {
        id: `show_${fact.showSlug}`,
        slug: fact.showSlug,
        name: fact.showName,
        officialWebsiteUrl: fact.officialWebsiteUrl,
        primaryCity: fact.primaryCity,
        primaryRegion: fact.primaryRegion,
        country: fact.country,
        geo: fact.geo,
      };
      showsMap.set(fact.showSlug, show);
      for (const ref of fact.externalRefs) {
        externalRefs.push({
          id: nanoid(10),
          showId: show.id,
          label: ref.label,
          url: ref.url,
          kind: ref.kind,
        });
      }
    }

    const editionId = `ed_${fact.showSlug}_${fact.year}`;
    editions.push({
      id: editionId,
      showId: show.id,
      year: fact.year,
      startDate: fact.startDate,
      endDate: fact.endDate,
      applicationDeadline: fact.applicationDeadline,
      venueName: fact.venueName,
      fullAddress: fact.fullAddress,
      geo: fact.geo,
      boothFeeMin: fact.boothFeeMin,
      boothFeeMax: fact.boothFeeMax,
      applicationFee: fact.applicationFee,
      currency: fact.currency,
      juryProcess: fact.juryProcess,
      attendance: fact.attendance,
      attendanceSourceUrl: fact.attendanceSourceUrl,
      directorName: fact.directorName,
      directorEmail: fact.directorEmail,
      directorPhone: fact.directorPhone,
      status: fact.endDate < now.split("T")[0] ? "completed" : "upcoming",
    });

    for (const link of fact.socialLinks) {
      socialLinks.push({
        id: nanoid(10),
        editionId,
        platform: link.platform,
        url: link.url,
      });
    }

    const fields = [
      "startDate",
      "endDate",
      "applicationDeadline",
      "fullAddress",
      "boothFeeMin",
      "applicationFee",
      "directorName",
    ] as const;
    for (const field of fields) {
      provenance.push({
        id: nanoid(10),
        entityType: "edition",
        entityId: editionId,
        field,
        sourceUrl: fact.sourceUrl,
        sourceKind: fact.sourceKind,
        capturedAt: now,
        adapterId: fact.adapterId,
      });
    }
  }

  const shows = Array.from(showsMap.values());

  const catalogOnly: DemoData = {
    users: [],
    artists: [],
    showgoers: [],
    directors: [],
    shows,
    editions,
    socialLinks,
    externalRefs,
    provenance,
    roiReports: [],
    roiBreakdowns: [],
    aggregates: [],
    applications: [],
    routes: [],
    routeStops: [],
    bookings: [],
    posts: [],
    comments: [],
    announcements: [],
    waitlist: [],
    boothOffers: [],
    boothRequests: [],
    juryFeedback: [],
    alerts: [],
    weather: [],
    sponsorshipTiers: [],
    subscriptions: [],
    products: [],
    orders: [],
    promotions: [],
    follows: [],
  };

  // Production catalog is official-site facts only. Invented people, posts, ROI, weather, and routes stay off unless explicitly enabled for internal QA.
  if (process.env.SHOWSHOW_DEMO_PERSONAS !== "1") {
    return catalogOnly;
  }

  const promoted = shows.find((s) => s.slug === "cherry-creek-arts-festival");
  if (promoted) promoted.promotedUntil = "2026-12-31";

  const users: User[] = [
    {
      id: "user_aria",
      name: "Aria Delgado",
      email: "aria@studio.example",
      roles: ["artist"],
      homeBase: { lat: 41.88, lng: -87.63, label: "Chicago, IL" },
      avatarUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=aria",
      createdAt: now,
    },
    {
      id: "user_sam",
      name: "Sam Okonkwo",
      email: "sam@clay.example",
      roles: ["artist"],
      homeBase: { lat: 39.74, lng: -104.99, label: "Denver, CO" },
      avatarUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=sam",
      createdAt: now,
    },
    {
      id: "user_jordan",
      name: "Jordan Blake",
      email: "jordan@cherryarts.org",
      roles: ["director"],
      avatarUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=jordan",
      createdAt: now,
    },
    {
      id: "user_lee",
      name: "Lee Nakamura",
      email: "lee@mail.example",
      roles: ["showgoer"],
      homeBase: { lat: 37.77, lng: -122.42, label: "San Francisco, CA" },
      avatarUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=lee",
      createdAt: now,
    },
    {
      id: "user_admin",
      name: "ShowShow Admin",
      email: "ops@showshow.example",
      roles: ["admin"],
      createdAt: now,
    },
  ];

  const artists: ArtistProfile[] = [
    {
      id: "artist_aria",
      userId: "user_aria",
      slug: "aria-delgado",
      displayName: "Aria Delgado",
      tagline: "Wheel-thrown stoneware for everyday rituals",
      bio: "Chicago ceramicist. Seasonal fair circuit across the Midwest.",
      mediums: ["ceramics", "mixed_media"],
      portfolioUrls: [],
      boothDefaultSize: "10x10",
      stripeConnectReady: true,
      city: "Chicago",
      region: "IL",
    },
    {
      id: "artist_sam",
      userId: "user_sam",
      slug: "sam-okonkwo",
      displayName: "Sam Okonkwo",
      tagline: "Oil landscapes and small works for collectors on the move",
      bio: "Denver painter working plein air between mountain and plains fairs.",
      mediums: ["oil_painting", "drawing"],
      portfolioUrls: [],
      boothDefaultSize: "10x10",
      stripeConnectReady: false,
      city: "Denver",
      region: "CO",
    },
  ];

  const showgoers: DemoData["showgoers"] = [
    {
      id: "sg_lee",
      userId: "user_lee",
      favoriteShowIds: ["show_gold-coast-art-fair", "show_cherry-creek-arts-festival"],
      followedArtistIds: ["artist_aria", "artist_sam"],
    },
  ];

  const directors: DemoData["directors"] = [
    {
      id: "dir_jordan",
      userId: "user_jordan",
      showIds: ["show_cherry-creek-arts-festival"],
      verified: true,
      verifiedDomain: "cherryarts.org",
      verifiedAt: now,
    },
  ];

  const upcoming = editions.filter((e) => e.status === "upcoming" || e.status === "active");
  const pick = (...slugs: string[]) =>
    upcoming.filter((e) => slugs.some((s) => e.id.includes(s)));

  const ariaEditions = pick(
    "old-town-art-fair",
    "art-fair-on-the-square",
    "uptown-art-fair",
    "lakefront-festival-of-arts",
    "ann-arbor-street-art-fair",
  );
  const samEditions = pick(
    "cherry-creek-arts-festival",
    "boulder-creek-festival",
    "santa-fe-folk-art-market",
    "celebration-of-fine-art-scottsdale",
    "plaza-art-fair",
  );

  const applications: DemoData["applications"] = [
    ...ariaEditions.slice(0, 4).map((e, i) => ({
      id: `app_aria_${i}`,
      artistId: "artist_aria",
      editionId: e.id,
      status: (["accepted", "applied", "waitlisted", "interested"] as const)[i],
      officialApplyUrl: shows.find((s) => s.id === e.showId)!.officialWebsiteUrl + "/apply",
      appliedAt: i < 3 ? "2026-01-10T00:00:00.000Z" : undefined,
      updatedAt: now,
      reminderAt: e.applicationDeadline,
    })),
    ...samEditions.slice(0, 3).map((e, i) => ({
      id: `app_sam_${i}`,
      artistId: "artist_sam",
      editionId: e.id,
      status: (["accepted", "juried", "applied"] as const)[i],
      officialApplyUrl: shows.find((s) => s.id === e.showId)!.officialWebsiteUrl + "/apply",
      appliedAt: "2026-01-05T00:00:00.000Z",
      updatedAt: now,
    })),
  ];

  const roiReports: DemoData["roiReports"] = [];
  const roiBreakdowns: DemoData["roiBreakdowns"] = [];

  // Seed private ROI + enough opted-in reports for a few aggregates
  const completed = editions.filter((e) => e.year === 2025).slice(0, 8);
  completed.forEach((e, i) => {
    const reportId = `roi_${i}`;
    const booth = e.boothFeeMin ?? 500;
    const travel = 200 + i * 40;
    const lodging = 300 + i * 25;
    const other = 80;
    const gross = booth + travel + lodging + 400 + i * 120;
    roiReports.push({
      id: reportId,
      artistId: i % 2 === 0 ? "artist_aria" : "artist_sam",
      editionId: e.id,
      boothFee: booth,
      travel,
      lodging,
      otherExpenses: other,
      grossSales: gross,
      currency: "USD",
      hoursWorked: 24,
      optInAggregate: true,
      notes: "Self-reported demo log",
      createdAt: now,
      updatedAt: now,
    });
    const medium = MEDIUMS[i % MEDIUMS.length];
    roiBreakdowns.push({
      id: nanoid(8),
      reportId,
      medium,
      sales: Math.round(gross * 0.7),
      unitsSold: 8 + i,
    });
    roiBreakdowns.push({
      id: nanoid(8),
      reportId,
      medium: MEDIUMS[(i + 3) % MEDIUMS.length],
      sales: Math.round(gross * 0.3),
      unitsSold: 3 + i,
    });
  });

  // Extra opted-in reports to meet min-n on popular shows
  const targetEdition = editions.find((e) => e.id.includes("ann-arbor") && e.year === 2025);
  if (targetEdition) {
    for (let i = 0; i < 6; i++) {
      const reportId = `roi_aa_${i}`;
      const booth = targetEdition.boothFeeMin ?? 875;
      const expenses = booth + 500 + i * 50;
      const gross = expenses + 800 + i * 150;
      roiReports.push({
        id: reportId,
        artistId: i % 2 === 0 ? "artist_aria" : "artist_sam",
        editionId: targetEdition.id,
        boothFee: booth,
        travel: 250,
        lodging: 400,
        otherExpenses: 100,
        grossSales: gross,
        currency: "USD",
        optInAggregate: true,
        createdAt: now,
        updatedAt: now,
      });
      roiBreakdowns.push({
        id: nanoid(8),
        reportId,
        medium: i % 2 === 0 ? "ceramics" : "jewelry",
        sales: gross,
        unitsSold: 10 + i,
      });
    }
  }

  const aggregates = computeAggregates(roiReports, roiBreakdowns, editions, shows);

  const routes: DemoData["routes"] = [
    {
      id: "route_midwest",
      slug: "midwest-summer-circuit",
      name: "Midwest Summer Circuit",
      region: "Midwest",
      seasonLabel: "Summer 2026",
      description: "Chicago → Madison → Milwaukee → Ann Arbor — compact drives, strong ceramics buyers.",
    },
    {
      id: "route_mountain",
      slug: "mountain-west-spring",
      name: "Mountain West Spring",
      region: "Mountain West",
      seasonLabel: "Spring–Summer 2026",
      description: "Scottsdale → Boulder → Denver → Santa Fe for painters and jewelry.",
    },
  ];

  const routeStops: DemoData["routeStops"] = [
    ...pick(
      "old-town-art-fair",
      "art-fair-on-the-square",
      "lakefront-festival-of-arts",
      "ann-arbor-street-art-fair",
    ).map((e, order) => ({
      id: `rs_mw_${order}`,
      routeId: "route_midwest",
      editionId: e.id,
      order,
      travelMilesFromPrev: order === 0 ? 0 : 140 + order * 30,
      travelHoursFromPrev: order === 0 ? 0 : 2.5 + order * 0.4,
    })),
    ...pick(
      "celebration-of-fine-art-scottsdale",
      "boulder-creek-festival",
      "cherry-creek-arts-festival",
      "santa-fe-folk-art-market",
    ).map((e, order) => ({
      id: `rs_mt_${order}`,
      routeId: "route_mountain",
      editionId: e.id,
      order,
      travelMilesFromPrev: order === 0 ? 0 : 300 + order * 80,
      travelHoursFromPrev: order === 0 ? 0 : 5 + order,
    })),
    ...pick(
      "coconut-grove-arts-festival",
      "gasparilla-festival-of-the-arts",
      "winter-park-sidewalk-art-festival",
      "mainsail-art-festival",
    ).map((e, order) => ({
      id: `rs_fl_${order}`,
      routeId: "route_florida",
      editionId: e.id,
      order,
      travelMilesFromPrev: order === 0 ? 0 : 180 + order * 40,
      travelHoursFromPrev: order === 0 ? 0 : 3 + order * 0.5,
    })),
  ];

  // Add Florida winter circuit
  routes.push({
    id: "route_florida",
    slug: "florida-winter-circuit",
    name: "Florida Winter Circuit",
    region: "Southeast",
    seasonLabel: "Winter 2026–27",
    description: "Coconut Grove → Gasparilla → Winter Park → Mainsail — classic FL winter run.",
  });

  const bookings: DemoData["bookings"] = applications
    .filter((a) => a.status === "accepted" || a.status === "applied")
    .map((a) => ({
      id: `bk_${a.id}`,
      artistId: a.artistId,
      editionId: a.editionId,
      intent: a.status === "accepted" ? ("booked" as const) : ("applied" as const),
      createdAt: now,
    }));

  const posts: DemoData["posts"] = [
    {
      id: "post_1",
      authorUserId: "user_aria",
      artistId: "artist_aria",
      body: "Packing glaze tests for Old Town. New celadon batch survived the kiln.",
      createdAt: "2026-03-10T15:00:00.000Z",
      editionId: ariaEditions[0]?.id,
    },
    {
      id: "post_2",
      authorUserId: "user_sam",
      artistId: "artist_sam",
      body: "Accepted to Cherry Creek — booth map drops next month.",
      createdAt: "2026-03-08T18:00:00.000Z",
      editionId: samEditions[0]?.id,
    },
    {
      id: "post_3",
      authorUserId: "user_jordan",
      body: "Deadline extension: Cherry Creek applications now close Jan 22.",
      createdAt: "2026-01-12T12:00:00.000Z",
      editionId: samEditions[0]?.id,
    },
  ];

  const cherryEdition =
    upcoming.find((e) => e.id.includes("cherry-creek")) ?? upcoming[0];

  const comments: DemoData["comments"] = cherryEdition
    ? [
        {
          id: "c1",
          editionId: cherryEdition.id,
          authorUserId: "user_lee",
          body: "Coming Saturday afternoon — any shade on the south blocks?",
          createdAt: now,
        },
      ]
    : [];

  const announcements: DemoData["announcements"] = cherryEdition
    ? [
        {
          id: "ann_1",
          editionId: cherryEdition.id,
          directorUserId: "user_jordan",
          title: "Application deadline extended",
          body: "Official deadline moved to January 22. Apply on the show website.",
          kind: "deadline_extension",
          createdAt: "2026-01-12T12:00:00.000Z",
        },
      ]
    : [];

  const waitlist: DemoData["waitlist"] = [
    {
      id: "wl_1",
      editionId: ariaEditions[0]?.id ?? upcoming[0].id,
      boothLabel: "Block B-12",
      status: "open",
      createdAt: now,
    },
  ];

  const boothOffers: DemoData["boothOffers"] = [
    {
      id: "bo_1",
      editionId: ariaEditions[0]?.id ?? upcoming[0].id,
      artistId: "artist_aria",
      availableWindows: "Sat 12–2pm",
      notes: "Happy to cover a neighbor for lunch.",
    },
  ];

  const boothRequests: DemoData["boothRequests"] = [
    {
      id: "br_1",
      editionId: ariaEditions[0]?.id ?? upcoming[0].id,
      artistId: "artist_sam",
      neededWindow: "Sat 1–2pm",
      status: "open",
    },
  ];

  const juryFeedback: DemoData["juryFeedback"] = [
    {
      id: "jf_1",
      artistId: "artist_aria",
      editionId: ariaEditions[0]?.id ?? upcoming[0].id,
      imageUrls: [],
      outcome: "accepted",
      notes: "Submitted three tableware sets + one sculptural vessel.",
      createdAt: now,
    },
  ];

  const alerts: DemoData["alerts"] = upcoming.length
    ? [
        {
          id: "al_1",
          editionId: upcoming[0].id,
          kind: "weather" as const,
          title: "Wind advisory weekend of show",
          body: "Afternoon gusts are common this weekend. Stake tents early and check guy-lines at lunch.",
          createdAt: now,
        },
      ]
    : [];

  const weather: DemoData["weather"] = upcoming.slice(0, 15).flatMap((e) => {
    const days = [e.startDate, e.endDate];
    return days.map((date, i) => ({
      id: nanoid(8),
      editionId: e.id,
      date,
      highF: 72 + (i % 5),
      lowF: 54 + (i % 4),
      condition: i % 2 === 0 ? "Partly cloudy" : "Clear",
      precipChance: (i * 10) % 40,
    }));
  });

  const sponsorshipTiers: DemoData["sponsorshipTiers"] = [
    {
      id: "tier_aria_studio",
      artistId: "artist_aria",
      name: "Studio Friend",
      monthlyPriceCents: 1500,
      perks: ["Monthly process note", "Early access to new glaze drops"],
      active: true,
    },
    {
      id: "tier_aria_patron",
      artistId: "artist_aria",
      name: "Booth Patron",
      monthlyPriceCents: 4500,
      perks: ["All Studio Friend perks", "Covers one application fee / quarter", "Patron-only shop preview"],
      active: true,
    },
  ];

  const subscriptions: DemoData["subscriptions"] = [
    {
      id: "sub_1",
      tierId: "tier_aria_studio",
      patronUserId: "user_lee",
      status: "active",
      startedAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const products: DemoData["products"] = [
    {
      id: "prod_1",
      artistId: "artist_aria",
      title: "Celadon pour-over set",
      description: "Two cups + carafe. Food-safe glaze.",
      priceCents: 16800,
      inventory: 4,
      medium: "ceramics",
      active: true,
    },
    {
      id: "prod_2",
      artistId: "artist_sam",
      title: "Front Range study — 8×10",
      description: "Oil on linen panel.",
      priceCents: 42000,
      inventory: 1,
      medium: "oil_painting",
      active: true,
    },
  ];

  const orders: DemoData["orders"] = [];

  const promotions: DemoData["promotions"] = [
    {
      id: "promo_1",
      showId: "show_cherry-creek-arts-festival",
      directorUserId: "user_jordan",
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "2026-12-31T00:00:00.000Z",
      budgetCents: 50000,
      status: "active",
    },
  ];

  const follows: DemoData["follows"] = [
    { id: "f1", followerUserId: "user_lee", artistId: "artist_aria", createdAt: now },
    { id: "f2", followerUserId: "user_lee", artistId: "artist_sam", createdAt: now },
  ];

  return {
    users,
    artists,
    showgoers,
    directors,
    shows,
    editions,
    socialLinks,
    externalRefs,
    provenance,
    roiReports,
    roiBreakdowns,
    aggregates,
    applications,
    routes,
    routeStops,
    bookings,
    posts,
    comments,
    announcements,
    waitlist,
    boothOffers,
    boothRequests,
    juryFeedback,
    alerts,
    weather,
    sponsorshipTiers,
    subscriptions,
    products,
    orders,
    promotions,
    follows,
  };
}

const MIN_N = 5;

function computeAggregates(
  reports: DemoData["roiReports"],
  breakdowns: DemoData["roiBreakdowns"],
  editions: DemoData["editions"],
  _shows: DemoData["shows"],
): ShowAggregateMetric[] {
  const byEdition = new Map<string, DemoData["roiReports"]>();
  for (const r of reports.filter((r) => r.optInAggregate)) {
    const list = byEdition.get(r.editionId) ?? [];
    list.push(r);
    byEdition.set(r.editionId, list);
  }

  const out: ShowAggregateMetric[] = [];
  for (const [editionId, list] of byEdition) {
    const edition = editions.find((e) => e.id === editionId);
    if (!edition) continue;
    const nets = list.map(
      (r) => r.grossSales - (r.boothFee + r.travel + r.lodging + r.otherExpenses),
    );
    const grosses = list.map((r) => r.grossSales);
    const expenses = list.map(
      (r) => r.boothFee + r.travel + r.lodging + r.otherExpenses,
    );
    const mediumTotals = new Map<Medium, number>();
    let mediumSum = 0;
    for (const r of list) {
      for (const b of breakdowns.filter((x) => x.reportId === r.id)) {
        mediumTotals.set(b.medium, (mediumTotals.get(b.medium) ?? 0) + b.sales);
        mediumSum += b.sales;
      }
    }
    const topMediums = Array.from(mediumTotals.entries())
      .map(([medium, sales]) => ({
        medium,
        share: mediumSum ? sales / mediumSum : 0,
      }))
      .sort((a, b) => b.share - a.share)
      .slice(0, 3);

    out.push({
      id: `agg_${editionId}`,
      editionId,
      showId: edition.showId,
      sampleSize: list.length,
      medianNet: median(nets),
      medianGrossSales: median(grosses),
      medianTotalExpenses: median(expenses),
      topMediums,
      label: "self_reported",
      computedAt: new Date().toISOString(),
      minNMet: list.length >= MIN_N,
    });
  }
  return out;
}

function median(nums: number[]): number | undefined {
  if (!nums.length) return undefined;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export { MIN_N, computeAggregates };
