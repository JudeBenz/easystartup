import { z } from "zod";

/**
 * Normalized fact schema for pluggable ingestion adapters.
 * Adapters (manual, official scrape, API, licensed) must emit this shape.
 * No rankings, scores, or editorial prose allowed.
 */

export const GeoSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const NormalizedEditionFactSchema = z.object({
  showSlug: z.string().min(1),
  showName: z.string().min(1),
  officialWebsiteUrl: z.string().url(),
  primaryCity: z.string(),
  primaryRegion: z.string(),
  country: z.string().default("US"),
  geo: GeoSchema,
  year: z.number().int(),
  startDate: z.string(),
  endDate: z.string(),
  applicationDeadline: z.string().optional(),
  venueName: z.string(),
  fullAddress: z.string(),
  boothFeeMin: z.number().optional(),
  boothFeeMax: z.number().optional(),
  applicationFee: z.number().optional(),
  currency: z.string().default("USD"),
  juryProcess: z.enum(["blind", "panel", "invitation", "open", "unknown"]),
  attendance: z.number().int().optional(),
  attendanceSourceUrl: z.string().url().optional(),
  directorName: z.string().optional(),
  directorEmail: z.string().email().optional(),
  directorPhone: z.string().optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.enum(["youtube", "instagram", "facebook", "tiktok", "other"]),
        url: z.string().url(),
      }),
    )
    .default([]),
  /** Outbound-only links to aggregators — never their rankings/copy. */
  externalRefs: z
    .array(
      z.object({
        label: z.string(),
        url: z.string().url(),
        kind: z.enum(["ranking_aggregator", "press", "other"]),
      }),
    )
    .default([]),
  sourceUrl: z.string().url(),
  sourceKind: z.enum(["official_site", "manual", "api", "licensed"]),
  adapterId: z.string(),
});

export type NormalizedEditionFact = z.infer<typeof NormalizedEditionFactSchema>;

/** Hosts we refuse to scrape — link-out only. */
export const BLOCKED_AGGREGATOR_HOSTS = [
  "zapplication.org",
  "artfairsourcebook.com",
  "sunshineartist.com",
  "entrythingy.com",
] as const;

export function assertNotAggregatorSource(url: string): void {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    throw new Error(`Invalid source URL: ${url}`);
  }
  if (BLOCKED_AGGREGATOR_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    throw new Error(
      `Refusing aggregator source ${host}. Capture facts from the show's official site and link out to aggregators instead.`,
    );
  }
}

export interface IngestionAdapter {
  id: string;
  label: string;
  sourceKind: NormalizedEditionFact["sourceKind"];
  fetchFacts(): Promise<NormalizedEditionFact[]>;
}
