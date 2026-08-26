import type { NormalizedEditionFact } from "@/lib/ingestion/schema";

/**
 * Demo facts modeled as if captured from each show's official website.
 * Names/fees/dates are fictional for the demo — replace with real official-site
 * captures via the manual adapter in production.
 */
const RAW: Omit<NormalizedEditionFact, "adapterId" | "sourceKind">[] = [
  {
    showSlug: "ann-arbor-street-art-fair",
    showName: "Ann Arbor Street Art Fair",
    officialWebsiteUrl: "https://www.artfair.org",
    primaryCity: "Ann Arbor",
    primaryRegion: "MI",
    country: "US",
    geo: { lat: 42.2808, lng: -83.743 },
    year: 2026,
    startDate: "2026-07-15",
    endDate: "2026-07-18",
    applicationDeadline: "2026-02-01",
    venueName: "South University District",
    fullAddress: "South University Ave, Ann Arbor, MI 48104",
    boothFeeMin: 875,
    boothFeeMax: 1125,
    applicationFee: 45,
    currency: "USD",
    juryProcess: "blind",
    attendance: 500000,
    attendanceSourceUrl: "https://www.artfair.org",
    directorName: "Maya Chen",
    directorEmail: "maya@artfair.org",
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/a2artfair" },
      { platform: "facebook", url: "https://facebook.com/a2artfair" },
    ],
    externalRefs: [
      {
        label: "Art Fair SourceBook listing",
        url: "https://www.artfairsourcebook.com",
        kind: "ranking_aggregator",
      },
    ],
    sourceUrl: "https://www.artfair.org",
  },
  {
    showSlug: "st-james-court-art-show",
    showName: "St. James Court Art Show",
    officialWebsiteUrl: "https://www.stjamescourtartshow.com",
    primaryCity: "Louisville",
    primaryRegion: "KY",
    country: "US",
    geo: { lat: 38.229, lng: -85.761 },
    year: 2026,
    startDate: "2026-10-02",
    endDate: "2026-10-04",
    applicationDeadline: "2026-03-15",
    venueName: "St. James Court",
    fullAddress: "St James Ct, Louisville, KY 40208",
    boothFeeMin: 550,
    boothFeeMax: 750,
    applicationFee: 40,
    currency: "USD",
    juryProcess: "panel",
    attendance: 250000,
    directorName: "Helen Park",
    socialLinks: [{ platform: "instagram", url: "https://instagram.com/stjamescourt" }],
    externalRefs: [],
    sourceUrl: "https://www.stjamescourtartshow.com",
  },
  {
    showSlug: "coconut-grove-arts-festival",
    showName: "Coconut Grove Arts Festival",
    officialWebsiteUrl: "https://www.cgaf.com",
    primaryCity: "Miami",
    primaryRegion: "FL",
    country: "US",
    geo: { lat: 25.727, lng: -80.241 },
    year: 2026,
    startDate: "2026-02-14",
    endDate: "2026-02-16",
    applicationDeadline: "2025-09-30",
    venueName: "Peacock Park & South Bayshore Drive",
    fullAddress: "3390 Pan American Dr, Miami, FL 33133",
    boothFeeMin: 650,
    boothFeeMax: 950,
    applicationFee: 50,
    currency: "USD",
    juryProcess: "blind",
    attendance: 150000,
    directorName: "Carlos Rivera",
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/cgartsfest" },
      { platform: "youtube", url: "https://youtube.com/@cgartsfest" },
    ],
    externalRefs: [],
    sourceUrl: "https://www.cgaf.com",
  },
  {
    showSlug: "cherry-creek-arts-festival",
    showName: "Cherry Creek Arts Festival",
    officialWebsiteUrl: "https://www.cherryarts.org",
    primaryCity: "Denver",
    primaryRegion: "CO",
    country: "US",
    geo: { lat: 39.717, lng: -104.95 },
    year: 2026,
    startDate: "2026-07-03",
    endDate: "2026-07-05",
    applicationDeadline: "2026-01-15",
    venueName: "Cherry Creek North",
    fullAddress: "3000 E 1st Ave, Denver, CO 80206",
    boothFeeMin: 900,
    boothFeeMax: 1200,
    applicationFee: 45,
    currency: "USD",
    juryProcess: "blind",
    attendance: 350000,
    directorName: "Jordan Blake",
    socialLinks: [{ platform: "instagram", url: "https://instagram.com/cherryarts" }],
    externalRefs: [],
    sourceUrl: "https://www.cherryarts.org",
  },
  {
    showSlug: "sausalito-art-festival",
    showName: "Sausalito Art Festival",
    officialWebsiteUrl: "https://www.sausalitoartfestival.org",
    primaryCity: "Sausalito",
    primaryRegion: "CA",
    country: "US",
    geo: { lat: 37.859, lng: -122.485 },
    year: 2026,
    startDate: "2026-09-04",
    endDate: "2026-09-06",
    applicationDeadline: "2026-03-01",
    venueName: "Marinship Park",
    fullAddress: "Bridgeway & Harbor Dr, Sausalito, CA 94965",
    boothFeeMin: 975,
    boothFeeMax: 1350,
    applicationFee: 50,
    currency: "USD",
    juryProcess: "panel",
    attendance: 40000,
    directorName: "Elena Vos",
    socialLinks: [{ platform: "facebook", url: "https://facebook.com/sausalitoartfest" }],
    externalRefs: [],
    sourceUrl: "https://www.sausalitoartfestival.org",
  },
];

/** Additional regional circuit shows — facts shaped for demo. */
const REGIONS: {
  city: string;
  region: string;
  lat: number;
  lng: number;
  name: string;
  slug: string;
  month: number;
  day: number;
  fee: number;
  appFee: number;
  jury: NormalizedEditionFact["juryProcess"];
}[] = [
  { city: "Chicago", region: "IL", lat: 41.88, lng: -87.63, name: "Old Town Art Fair", slug: "old-town-art-fair", month: 6, day: 13, fee: 800, appFee: 40, jury: "blind" },
  { city: "Madison", region: "WI", lat: 43.07, lng: -89.4, name: "Art Fair on the Square", slug: "art-fair-on-the-square", month: 7, day: 11, fee: 525, appFee: 35, jury: "panel" },
  { city: "Minneapolis", region: "MN", lat: 44.98, lng: -93.27, name: "Uptown Art Fair", slug: "uptown-art-fair", month: 8, day: 7, fee: 600, appFee: 40, jury: "blind" },
  { city: "Des Moines", region: "IA", lat: 41.59, lng: -93.62, name: "Arts Festival Des Moines", slug: "arts-festival-des-moines", month: 6, day: 26, fee: 450, appFee: 30, jury: "panel" },
  { city: "Kansas City", region: "MO", lat: 39.1, lng: -94.58, name: "Plaza Art Fair", slug: "plaza-art-fair", month: 9, day: 18, fee: 700, appFee: 40, jury: "blind" },
  { city: "Austin", region: "TX", lat: 30.27, lng: -97.74, name: "Austin Fine Arts Festival", slug: "austin-fine-arts-festival", month: 4, day: 10, fee: 650, appFee: 45, jury: "panel" },
  { city: "Houston", region: "TX", lat: 29.76, lng: -95.37, name: "Bayou City Art Festival", slug: "bayou-city-art-festival", month: 3, day: 20, fee: 725, appFee: 45, jury: "blind" },
  { city: "Dallas", region: "TX", lat: 32.78, lng: -96.8, name: "ArtFest Fort Worth", slug: "artfest-fort-worth", month: 4, day: 24, fee: 550, appFee: 35, jury: "open" },
  { city: "Santa Fe", region: "NM", lat: 35.69, lng: -105.94, name: "Santa Fe International Folk Art Market", slug: "santa-fe-folk-art-market", month: 7, day: 10, fee: 900, appFee: 55, jury: "invitation" },
  { city: "Phoenix", region: "AZ", lat: 33.45, lng: -112.07, name: "Scottsdale Arts Festival", slug: "scottsdale-arts-festival", month: 3, day: 13, fee: 675, appFee: 40, jury: "blind" },
  { city: "Portland", region: "OR", lat: 45.52, lng: -122.68, name: "Art in the Pearl", slug: "art-in-the-pearl", month: 9, day: 5, fee: 580, appFee: 35, jury: "panel" },
  { city: "Seattle", region: "WA", lat: 47.61, lng: -122.33, name: "Anacortes Arts Festival", slug: "anacortes-arts-festival", month: 8, day: 1, fee: 420, appFee: 30, jury: "panel" },
  { city: "San Diego", region: "CA", lat: 32.72, lng: -117.16, name: "La Jolla Festival of the Arts", slug: "la-jolla-festival-of-the-arts", month: 6, day: 20, fee: 850, appFee: 50, jury: "blind" },
  { city: "Los Angeles", region: "CA", lat: 34.05, lng: -118.24, name: "Beverly Hills Art Show", slug: "beverly-hills-art-show", month: 5, day: 16, fee: 950, appFee: 50, jury: "panel" },
  { city: "San Francisco", region: "CA", lat: 37.77, lng: -122.42, name: "American Craft Council Show SF", slug: "acc-show-sf", month: 8, day: 14, fee: 1100, appFee: 45, jury: "blind" },
  { city: "Boston", region: "MA", lat: 42.36, lng: -71.06, name: "Boston Arts Festival", slug: "boston-arts-festival", month: 9, day: 11, fee: 620, appFee: 40, jury: "panel" },
  { city: "Providence", region: "RI", lat: 41.82, lng: -71.41, name: "Rhode Island Open Studios Circuit", slug: "ri-open-studios", month: 10, day: 17, fee: 0, appFee: 25, jury: "open" },
  { city: "Philadelphia", region: "PA", lat: 39.95, lng: -75.17, name: "Rittenhouse Square Fine Art Show", slug: "rittenhouse-fine-art", month: 6, day: 5, fee: 780, appFee: 40, jury: "blind" },
  { city: "Pittsburgh", region: "PA", lat: 40.44, lng: -79.99, name: "Three Rivers Arts Festival", slug: "three-rivers-arts-festival", month: 6, day: 12, fee: 500, appFee: 35, jury: "panel" },
  { city: "New York", region: "NY", lat: 40.71, lng: -74.01, name: "Washington Square Outdoor Art Exhibit", slug: "washington-square-outdoor", month: 5, day: 23, fee: 400, appFee: 30, jury: "open" },
  { city: "Brooklyn", region: "NY", lat: 40.68, lng: -73.94, name: "Renegade Craft Fair Brooklyn", slug: "renegade-brooklyn", month: 11, day: 14, fee: 350, appFee: 25, jury: "open" },
  { city: "Atlanta", region: "GA", lat: 33.75, lng: -84.39, name: "Atlanta Arts Festival", slug: "atlanta-arts-festival", month: 9, day: 19, fee: 560, appFee: 35, jury: "panel" },
  { city: "Asheville", region: "NC", lat: 35.6, lng: -82.55, name: "Downtown After 5 Art Walk Asheville", slug: "asheville-art-walk", month: 8, day: 21, fee: 200, appFee: 20, jury: "open" },
  { city: "Charleston", region: "SC", lat: 32.78, lng: -79.93, name: "Piccolo Spoleto Crafts Fair", slug: "piccolo-spoleto-crafts", month: 5, day: 29, fee: 480, appFee: 35, jury: "panel" },
  { city: "Nashville", region: "TN", lat: 36.16, lng: -86.78, name: "Tennessee Craft Fair", slug: "tennessee-craft-fair", month: 5, day: 1, fee: 430, appFee: 30, jury: "blind" },
  { city: "New Orleans", region: "LA", lat: 29.95, lng: -90.07, name: "New Orleans Jazz Fest Marketplace", slug: "nola-jazzfest-marketplace", month: 4, day: 24, fee: 700, appFee: 45, jury: "invitation" },
  { city: "Indianapolis", region: "IN", lat: 39.77, lng: -86.16, name: "Broad Ripple Art Fair", slug: "broad-ripple-art-fair", month: 5, day: 9, fee: 390, appFee: 30, jury: "panel" },
  { city: "Columbus", region: "OH", lat: 39.96, lng: -83.0, name: "Columbus Arts Festival", slug: "columbus-arts-festival", month: 6, day: 5, fee: 520, appFee: 35, jury: "blind" },
  { city: "Cleveland", region: "OH", lat: 41.5, lng: -81.69, name: "Cain Park Arts Festival", slug: "cain-park-arts-festival", month: 7, day: 10, fee: 410, appFee: 30, jury: "panel" },
  { city: "Detroit", region: "MI", lat: 42.33, lng: -83.05, name: "Art Detroit Fair", slug: "art-detroit-fair", month: 9, day: 12, fee: 480, appFee: 35, jury: "open" },
  { city: "Grand Rapids", region: "MI", lat: 42.96, lng: -85.67, name: "Festival of the Arts Grand Rapids", slug: "festival-arts-grand-rapids", month: 6, day: 6, fee: 360, appFee: 25, jury: "open" },
  { city: "Milwaukee", region: "WI", lat: 43.04, lng: -87.91, name: "Lakefront Festival of Arts", slug: "lakefront-festival-arts", month: 6, day: 19, fee: 640, appFee: 40, jury: "blind" },
  { city: "Baltimore", region: "MD", lat: 39.29, lng: -76.61, name: "Artscape Baltimore", slug: "artscape-baltimore", month: 7, day: 17, fee: 300, appFee: 25, jury: "open" },
  { city: "Washington", region: "DC", lat: 38.91, lng: -77.04, name: "Smithsonian Craft Show", slug: "smithsonian-craft-show", month: 4, day: 23, fee: 1200, appFee: 55, jury: "blind" },
  { city: "Virginia Beach", region: "VA", lat: 36.85, lng: -75.98, name: "Boardwalk Art Show", slug: "boardwalk-art-show", month: 6, day: 18, fee: 470, appFee: 35, jury: "panel" },
  { city: "Tampa", region: "FL", lat: 27.95, lng: -82.46, name: "Gasparilla Festival of the Arts", slug: "gasparilla-festival-arts", month: 3, day: 7, fee: 590, appFee: 40, jury: "blind" },
  { city: "Orlando", region: "FL", lat: 28.54, lng: -81.38, name: "Winter Park Sidewalk Art Festival", slug: "winter-park-sidewalk", month: 3, day: 20, fee: 530, appFee: 35, jury: "panel" },
  { city: "Sarasota", region: "FL", lat: 27.34, lng: -82.53, name: "Sarasota Fine Craft Marketplace", slug: "sarasota-fine-craft", month: 11, day: 6, fee: 440, appFee: 30, jury: "open" },
  { city: "Boulder", region: "CO", lat: 40.02, lng: -105.27, name: "Boulder Creek Festival Arts", slug: "boulder-creek-festival-arts", month: 5, day: 23, fee: 380, appFee: 30, jury: "open" },
  { city: "Salt Lake City", region: "UT", lat: 40.76, lng: -111.89, name: "Utah Arts Festival", slug: "utah-arts-festival", month: 6, day: 25, fee: 460, appFee: 35, jury: "panel" },
  { city: "Boise", region: "ID", lat: 43.62, lng: -116.2, name: "Art in the Park Boise", slug: "art-in-the-park-boise", month: 9, day: 5, fee: 340, appFee: 25, jury: "open" },
  { city: "Omaha", region: "NE", lat: 41.26, lng: -95.94, name: "Countryside Village Art Fair", slug: "countryside-village-art", month: 6, day: 6, fee: 310, appFee: 25, jury: "panel" },
  { city: "Oklahoma City", region: "OK", lat: 35.47, lng: -97.52, name: "Festival of the Arts OKC", slug: "festival-arts-okc", month: 4, day: 21, fee: 420, appFee: 30, jury: "blind" },
  { city: "Little Rock", region: "AR", lat: 34.75, lng: -92.29, name: "Riverfest Marketplace", slug: "riverfest-marketplace", month: 5, day: 22, fee: 280, appFee: 20, jury: "open" },
  { city: "Memphis", region: "TN", lat: 35.15, lng: -90.05, name: "Cooper-Young Festival Marketplace", slug: "cooper-young-marketplace", month: 9, day: 12, fee: 250, appFee: 20, jury: "open" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function buildFromRegions(): Omit<NormalizedEditionFact, "adapterId" | "sourceKind">[] {
  return REGIONS.map((r) => {
    const start = `2026-${pad(r.month)}-${pad(r.day)}`;
    const endDay = Math.min(r.day + 2, 28);
    const end = `2026-${pad(r.month)}-${pad(endDay)}`;
    const deadlineMonth = r.month > 3 ? r.month - 3 : 12;
    const deadlineYear = r.month > 3 ? 2026 : 2025;
    const deadline = `${deadlineYear}-${pad(deadlineMonth)}-15`;
    const domain = `${r.slug.replace(/-/g, "")}.example.org`;
    return {
      showSlug: r.slug,
      showName: r.name,
      officialWebsiteUrl: `https://www.${domain}`,
      primaryCity: r.city,
      primaryRegion: r.region,
      country: "US",
      geo: { lat: r.lat, lng: r.lng },
      year: 2026,
      startDate: start,
      endDate: end,
      applicationDeadline: deadline,
      venueName: `${r.city} Festival Grounds`,
      fullAddress: `100 Festival Way, ${r.city}, ${r.region}`,
      boothFeeMin: r.fee,
      boothFeeMax: Math.round(r.fee * 1.25),
      applicationFee: r.appFee,
      currency: "USD",
      juryProcess: r.jury,
      attendance: 20000 + Math.round(r.fee * 40),
      attendanceSourceUrl: `https://www.${domain}`,
      directorName: "Show Director",
      directorEmail: `director@${domain}`,
      socialLinks: [
        { platform: "instagram" as const, url: `https://instagram.com/${r.slug.replace(/-/g, "")}` },
      ],
      externalRefs: [],
      sourceUrl: `https://www.${domain}`,
    };
  });
}

/** Prior-year editions for YoY history on a subset of shows. */
function priorYearFacts(
  base: Omit<NormalizedEditionFact, "adapterId" | "sourceKind">[],
): Omit<NormalizedEditionFact, "adapterId" | "sourceKind">[] {
  return base.slice(0, 12).map((f) => ({
    ...f,
    year: 2025,
    startDate: f.startDate.replace("2026", "2025"),
    endDate: f.endDate.replace("2026", "2025"),
    applicationDeadline: f.applicationDeadline
      ? f.applicationDeadline.replace("2026", "2025").replace("2025", "2024")
      : undefined,
    boothFeeMin: f.boothFeeMin ? Math.round(f.boothFeeMin * 0.95) : undefined,
    boothFeeMax: f.boothFeeMax ? Math.round(f.boothFeeMax * 0.95) : undefined,
    attendance: f.attendance ? Math.round(f.attendance * 0.92) : undefined,
  }));
}

const ALL = [...RAW, ...buildFromRegions()];
export const SEED_OFFICIAL_FACTS: Omit<NormalizedEditionFact, "adapterId" | "sourceKind">[] = [
  ...ALL,
  ...priorYearFacts(ALL),
];
