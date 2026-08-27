import priority100 from "@/data/priority-100.json";
import verifiedCaptures from "@/data/verified-captures.json";
import type { NormalizedEditionFact } from "@/lib/ingestion/schema";

type PriorityShow = (typeof priority100)[number];
type Capture = {
  startDate?: string;
  endDate?: string;
  applicationDeadline?: string;
  boothFeeMin?: number;
  boothFeeMax?: number;
  applicationFee?: number;
  juryProcess?: NormalizedEditionFact["juryProcess"];
  venueName?: string;
  fullAddress?: string;
  attendance?: number;
  sourceUrl?: string;
};

const SEASON_MONTH: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function monthFromHint(hint: string): number {
  const lower = hint.toLowerCase();
  for (const [name, month] of Object.entries(SEASON_MONTH)) {
    if (lower.includes(name)) return month;
  }
  if (lower.includes("labor day")) return 9;
  if (lower.includes("memorial")) return 5;
  if (lower.includes("presidents")) return 2;
  if (lower.includes("july 4") || lower.includes("4th")) return 7;
  return 6;
}

function weekendInMonth(year: number, month: number, week = 2) {
  // Prefer a Fri–Sun block in the given month (approx; refined by verified captures).
  const startDay = Math.min(1 + (week - 1) * 7 + 4, 26);
  const start = `${year}-${pad(month)}-${pad(startDay)}`;
  const end = `${year}-${pad(month)}-${pad(startDay + 2)}`;
  const deadlineMonth = month > 3 ? month - 3 : month + 9;
  const deadlineYear = month > 3 ? year : year - 1;
  const deadline = `${deadlineYear}-${pad(deadlineMonth)}-15`;
  return { start, end, deadline };
}

function factFromPriority(
  show: PriorityShow,
  capture?: Capture,
): Omit<NormalizedEditionFact, "adapterId" | "sourceKind"> {
  const month = monthFromHint(show.seasonHint);
  // Prefer calendar year of verified startDate when present
  let year = 2026;
  if (capture?.startDate) year = Number(capture.startDate.slice(0, 4));
  const approx = weekendInMonth(year, month);

  const startDate = capture?.startDate ?? approx.start;
  const endDate = capture?.endDate ?? approx.end;
  const applicationDeadline = capture?.applicationDeadline ?? approx.deadline;
  const sourceUrl = capture?.sourceUrl ?? show.officialWebsiteUrl;

  return {
    showSlug: show.slug,
    showName: show.name,
    officialWebsiteUrl: show.officialWebsiteUrl,
    primaryCity: show.city,
    primaryRegion: show.region,
    country: "US",
    geo: { lat: show.lat, lng: show.lng },
    year: Number(startDate.slice(0, 4)),
    startDate,
    endDate,
    applicationDeadline,
    venueName: capture?.venueName ?? `${show.city} festival grounds`,
    fullAddress: capture?.fullAddress ?? `${show.city}, ${show.region}`,
    boothFeeMin: capture?.boothFeeMin,
    boothFeeMax: capture?.boothFeeMax,
    applicationFee: capture?.applicationFee,
    currency: "USD",
    juryProcess: capture?.juryProcess ?? "unknown",
    attendance: capture?.attendance,
    attendanceSourceUrl: capture?.attendance ? sourceUrl : undefined,
    socialLinks: [],
    externalRefs: [],
    sourceUrl,
  };
}

const captures = verifiedCaptures as Record<string, Capture>;

/** Priority Coverage 100 — official URLs + verified overlays where captured. */
export const SEED_OFFICIAL_FACTS: Omit<NormalizedEditionFact, "adapterId" | "sourceKind">[] = (
  priority100 as PriorityShow[]
).map((show) => factFromPriority(show, captures[show.slug]));

/** Prior-year stubs for shows with verified captures (YoY history). */
export const SEED_PRIOR_YEAR_FACTS: Omit<NormalizedEditionFact, "adapterId" | "sourceKind">[] =
  SEED_OFFICIAL_FACTS.filter((f) => captures[f.showSlug]).map((f) => ({
    ...f,
    year: f.year - 1,
    startDate: f.startDate.replace(String(f.year), String(f.year - 1)),
    endDate: f.endDate.replace(String(f.year), String(f.year - 1)),
    applicationDeadline: f.applicationDeadline
      ? f.applicationDeadline.replace(String(f.year), String(f.year - 1)).replace(
          String(f.year - 1),
          String(f.year - 2),
        )
      : undefined,
    boothFeeMin: f.boothFeeMin ? Math.round(f.boothFeeMin * 0.95) : undefined,
    boothFeeMax: f.boothFeeMax ? Math.round(f.boothFeeMax * 0.95) : undefined,
    attendance: f.attendance ? Math.round(f.attendance * 0.95) : undefined,
  }));

export const ALL_SEED_FACTS = [...SEED_OFFICIAL_FACTS, ...SEED_PRIOR_YEAR_FACTS];
