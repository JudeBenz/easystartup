import { hash } from "bcryptjs";
import { and, asc, desc, eq, gte, inArray, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requirePostgres } from "@/lib/db/client";
import {
  announcements,
  applications,
  artists,
  boothOffers,
  boothRequests,
  directors,
  editions,
  juryFeedback,
  products,
  promotions,
  roiReports,
  showAggregates,
  showComments,
  shows,
  sponsorshipTiers,
  users,
  waitlistBooths,
} from "@/lib/db/schema";
import type {
  Application,
  ApplicationStatus,
  ArtistProfile,
  BoothSitOffer,
  BoothSitRequest,
  DemoData,
  DirectorAnnouncement,
  DirectorProfile,
  JuryFeedbackShare,
  Medium,
  Product,
  PromotedListing,
  RoiMediumBreakdown,
  RoiReport,
  Show,
  ShowAggregateMetric,
  ShowComment,
  ShowEdition,
  SponsorshipTier,
  User,
  UserRole,
  WaitlistListing,
} from "@/types/domain";
import { MIN_N } from "./seed";

type ShowRow = typeof shows.$inferSelect;
type EditionRow = typeof editions.$inferSelect;
type ArtistRow = typeof artists.$inferSelect;
type UserRow = typeof users.$inferSelect;
type DirectorRow = typeof directors.$inferSelect;
type ApplicationRow = typeof applications.$inferSelect;
type RoiRow = typeof roiReports.$inferSelect;
type AggregateRow = typeof showAggregates.$inferSelect;
type CommentRow = typeof showComments.$inferSelect;
type AnnouncementRow = typeof announcements.$inferSelect;
type WaitlistRow = typeof waitlistBooths.$inferSelect;
type ProductRow = typeof products.$inferSelect;
type TierRow = typeof sponsorshipTiers.$inferSelect;
type PromotionRow = typeof promotions.$inferSelect;
type JuryRow = typeof juryFeedback.$inferSelect;
type BoothOfferRow = typeof boothOffers.$inferSelect;
type BoothRequestRow = typeof boothRequests.$inferSelect;

function toIso(value: Date | string | null | undefined): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function num(text: string | null | undefined, fallback = 0): number {
  if (text == null || text === "") return fallback;
  const n = Number(text);
  return Number.isFinite(n) ? n : fallback;
}

function median(nums: number[]): number | undefined {
  if (!nums.length) return undefined;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1]! + s[mid]!) / 2);
}

function netOf(r: Pick<RoiRow, "grossSales" | "boothFee" | "travel" | "lodging" | "otherExpenses">) {
  return r.grossSales - (r.boothFee + r.travel + r.lodging + r.otherExpenses);
}

function reminderFromDeadline(deadline?: string | null) {
  if (!deadline) return undefined;
  const d = new Date(`${deadline}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setUTCDate(d.getUTCDate() - 14);
  return d;
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "artist";
}

export function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.image ?? undefined,
    roles: (row.roles as UserRole[]) ?? [],
    createdAt: row.createdAt.toISOString(),
    homeBase:
      row.homeLat && row.homeLng
        ? {
            lat: num(row.homeLat),
            lng: num(row.homeLng),
            label: row.homeLabel ?? "",
          }
        : undefined,
  };
}

export function mapShow(row: ShowRow): Show {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    officialWebsiteUrl: row.officialWebsiteUrl,
    primaryCity: row.primaryCity,
    primaryRegion: row.primaryRegion,
    country: row.country,
    geo: { lat: num(row.lat), lng: num(row.lng) },
    promotedUntil: toIso(row.promotedUntil),
  };
}

export function mapEdition(row: EditionRow): ShowEdition {
  return {
    id: row.id,
    showId: row.showId,
    year: row.year,
    startDate: row.startDate,
    endDate: row.endDate,
    applicationDeadline: row.applicationDeadline ?? undefined,
    venueName: row.venueName,
    fullAddress: row.fullAddress,
    geo: { lat: num(row.lat), lng: num(row.lng) },
    boothFeeMin: row.boothFeeMin ?? undefined,
    boothFeeMax: row.boothFeeMax ?? undefined,
    applicationFee: row.applicationFee ?? undefined,
    currency: row.currency,
    juryProcess: row.juryProcess as ShowEdition["juryProcess"],
    attendance: row.attendance ?? undefined,
    attendanceSourceUrl: row.attendanceSourceUrl ?? undefined,
    directorName: row.directorName ?? undefined,
    directorEmail: row.directorEmail ?? undefined,
    directorPhone: row.directorPhone ?? undefined,
    status: row.status as ShowEdition["status"],
  };
}

export function mapArtist(row: ArtistRow): ArtistProfile {
  return {
    id: row.id,
    userId: row.userId,
    slug: row.slug,
    displayName: row.displayName,
    tagline: row.tagline,
    bio: row.bio,
    mediums: (row.mediums as Medium[]) ?? [],
    portfolioUrls: row.portfolioUrls ?? [],
    boothDefaultSize: row.boothDefaultSize ?? undefined,
    stripeConnectReady: row.stripeConnectReady,
    city: row.city,
    region: row.region,
  };
}

function mapDirector(row: DirectorRow): DirectorProfile {
  return {
    id: row.id,
    userId: row.userId,
    showIds: row.showIds ?? [],
    verified: row.verified,
    verifiedDomain: row.verifiedDomain ?? undefined,
    verifiedAt: toIso(row.verifiedAt),
  };
}

function mapApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    artistId: row.artistId,
    editionId: row.editionId,
    status: row.status as ApplicationStatus,
    officialApplyUrl: row.officialApplyUrl,
    appliedAt: toIso(row.appliedAt),
    updatedAt: row.updatedAt.toISOString(),
    reminderAt: toIso(row.reminderAt),
    notes: row.notes ?? undefined,
  };
}

function mapRoi(row: RoiRow): RoiReport {
  return {
    id: row.id,
    artistId: row.artistId,
    editionId: row.editionId,
    boothFee: row.boothFee,
    travel: row.travel,
    lodging: row.lodging,
    otherExpenses: row.otherExpenses,
    grossSales: row.grossSales,
    currency: row.currency,
    hoursWorked: row.hoursWorked ?? undefined,
    notes: row.notes ?? undefined,
    optInAggregate: row.optInAggregate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapAggregate(row: AggregateRow): ShowAggregateMetric {
  return {
    id: row.id,
    editionId: row.editionId,
    showId: row.showId,
    sampleSize: row.sampleSize,
    medianNet: row.medianNet ?? undefined,
    medianGrossSales: row.medianGrossSales ?? undefined,
    medianTotalExpenses: row.medianTotalExpenses ?? undefined,
    topMediums: (row.topMediums as ShowAggregateMetric["topMediums"]) ?? [],
    label: "self_reported",
    computedAt: row.computedAt.toISOString(),
    minNMet: row.minNMet,
  };
}

function mapComment(row: CommentRow): ShowComment {
  return {
    id: row.id,
    editionId: row.editionId,
    authorUserId: row.authorUserId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapAnnouncement(row: AnnouncementRow): DirectorAnnouncement {
  return {
    id: row.id,
    editionId: row.editionId,
    directorUserId: row.directorUserId,
    title: row.title,
    body: row.body,
    kind: row.kind as DirectorAnnouncement["kind"],
    createdAt: row.createdAt.toISOString(),
  };
}

function mapWaitlist(row: WaitlistRow): WaitlistListing {
  return {
    id: row.id,
    editionId: row.editionId,
    boothLabel: row.boothLabel ?? undefined,
    status: row.status as WaitlistListing["status"],
    createdAt: row.createdAt.toISOString(),
  };
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    artistId: row.artistId,
    title: row.title,
    description: row.description,
    priceCents: row.priceCents,
    inventory: row.inventory,
    imageUrl: row.imageUrl ?? undefined,
    medium: row.medium as Medium,
    active: row.active,
  };
}

function mapTier(row: TierRow): SponsorshipTier {
  return {
    id: row.id,
    artistId: row.artistId,
    name: row.name,
    monthlyPriceCents: row.monthlyPriceCents,
    perks: row.perks ?? [],
    active: row.active,
  };
}

function mapPromotion(row: PromotionRow): PromotedListing {
  return {
    id: row.id,
    showId: row.showId,
    directorUserId: row.directorUserId,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    budgetCents: row.budgetCents,
    status: row.status as PromotedListing["status"],
  };
}

function mapJury(row: JuryRow): JuryFeedbackShare {
  return {
    id: row.id,
    artistId: row.artistId,
    editionId: row.editionId,
    imageUrls: row.imageUrls ?? [],
    outcome: row.outcome as JuryFeedbackShare["outcome"],
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapBoothOffer(row: BoothOfferRow): BoothSitOffer {
  return {
    id: row.id,
    editionId: row.editionId,
    artistId: row.artistId,
    availableWindows: row.availableWindows,
    notes: row.notes ?? undefined,
  };
}

function mapBoothRequest(row: BoothRequestRow): BoothSitRequest {
  return {
    id: row.id,
    editionId: row.editionId,
    artistId: row.artistId,
    neededWindow: row.neededWindow,
    status: row.status as BoothSitRequest["status"],
  };
}

function pickCurrent(eds: ShowEdition[]): ShowEdition | undefined {
  return eds.find((e) => e.status === "upcoming" || e.status === "active") ?? eds[0];
}

async function recomputeShowAggregate(showId: string) {
  const db = requirePostgres();
  const showEditions = await db.select().from(editions).where(eq(editions.showId, showId));
  if (!showEditions.length) return;

  const editionIds = showEditions.map((e) => e.id);
  const opted = await db
    .select()
    .from(roiReports)
    .where(and(eq(roiReports.optInAggregate, true), inArray(roiReports.editionId, editionIds)));

  const latest = [...showEditions].sort((a, b) => b.year - a.year)[0]!;
  const nets = opted.map(netOf);
  const grosses = opted.map((r) => r.grossSales);
  const expenses = opted.map((r) => r.boothFee + r.travel + r.lodging + r.otherExpenses);
  const sampleSize = opted.length;
  const now = new Date();

  const existing = await db
    .select()
    .from(showAggregates)
    .where(and(eq(showAggregates.showId, showId), eq(showAggregates.editionId, latest.id)))
    .limit(1)
    .then((r) => r[0]);

  const values = {
    sampleSize,
    medianNet: median(nets) ?? null,
    medianGrossSales: median(grosses) ?? null,
    medianTotalExpenses: median(expenses) ?? null,
    topMediums: [] as { medium: string; share: number }[],
    label: "self_reported",
    computedAt: now,
    minNMet: sampleSize >= MIN_N,
  };

  if (existing) {
    await db.update(showAggregates).set(values).where(eq(showAggregates.id, existing.id));
  } else {
    await db.insert(showAggregates).values({
      id: `agg_${nanoid(8)}`,
      editionId: latest.id,
      showId,
      ...values,
    });
  }
}

export async function pgListShows() {
  const db = requirePostgres();
  const [showRows, editionRows, aggRows] = await Promise.all([
    db.select().from(shows),
    db.select().from(editions),
    db.select().from(showAggregates).where(eq(showAggregates.minNMet, true)),
  ]);

  const editionsByShow = new Map<string, ShowEdition[]>();
  for (const row of editionRows) {
    const mapped = mapEdition(row);
    const list = editionsByShow.get(mapped.showId) ?? [];
    list.push(mapped);
    editionsByShow.set(mapped.showId, list);
  }
  for (const list of editionsByShow.values()) {
    list.sort((a, b) => b.year - a.year);
  }

  const aggsByShow = new Map<string, ShowAggregateMetric[]>();
  for (const row of aggRows) {
    const mapped = mapAggregate(row);
    const list = aggsByShow.get(mapped.showId) ?? [];
    list.push(mapped);
    aggsByShow.set(mapped.showId, list);
  }

  return showRows
    .map((row) => {
      const show = mapShow(row);
      const eds = editionsByShow.get(show.id) ?? [];
      const current = pickCurrent(eds);
      const aggregate = (aggsByShow.get(show.id) ?? [])
        .slice()
        .sort((a, b) => (b.medianNet ?? 0) - (a.medianNet ?? 0))[0];
      return {
        show,
        current,
        editions: eds,
        aggregate,
        promoted: Boolean(show.promotedUntil),
      };
    })
    .sort((a, b) => {
      if (a.promoted !== b.promoted) return a.promoted ? -1 : 1;
      return a.show.name.localeCompare(b.show.name);
    });
}

export async function pgGetShowBySlug(slug: string) {
  const db = requirePostgres();
  const showRow = await db.query.shows.findFirst({ where: eq(shows.slug, slug) });
  if (!showRow) return null;
  const show = mapShow(showRow);

  const editionRows = await db
    .select()
    .from(editions)
    .where(eq(editions.showId, show.id))
    .orderBy(desc(editions.year));
  const eds = editionRows.map(mapEdition);
  const current = pickCurrent(eds);

  const aggregates = (
    await db.select().from(showAggregates).where(eq(showAggregates.showId, show.id))
  ).map(mapAggregate);

  let comments: ShowComment[] = [];
  let announcementsList: DirectorAnnouncement[] = [];
  let waitlist: WaitlistListing[] = [];
  let offers: BoothSitOffer[] = [];
  let requests: BoothSitRequest[] = [];

  if (current) {
    const [commentRows, announcementRows, waitlistRows, offerRows, requestRows] =
      await Promise.all([
        db.select().from(showComments).where(eq(showComments.editionId, current.id)),
        db.select().from(announcements).where(eq(announcements.editionId, current.id)),
        db.select().from(waitlistBooths).where(eq(waitlistBooths.editionId, current.id)),
        db.select().from(boothOffers).where(eq(boothOffers.editionId, current.id)),
        db.select().from(boothRequests).where(eq(boothRequests.editionId, current.id)),
      ]);
    comments = commentRows.map(mapComment);
    announcementsList = announcementRows.map(mapAnnouncement);
    waitlist = waitlistRows.map(mapWaitlist);
    offers = offerRows.map(mapBoothOffer);
    requests = requestRows.map(mapBoothRequest);
  }

  return {
    show,
    editions: eds,
    current,
    socialLinks: [] as DemoData["socialLinks"],
    externalRefs: [] as DemoData["externalRefs"],
    provenance: [] as DemoData["provenance"],
    aggregates,
    comments,
    announcements: announcementsList,
    alerts: [] as DemoData["alerts"],
    weather: [] as DemoData["weather"],
    waitlist,
    boothOffers: offers,
    boothRequests: requests,
  };
}

export async function pgListEditionsForCalendar() {
  const db = requirePostgres();
  const rows = await db
    .select({ edition: editions, show: shows })
    .from(editions)
    .innerJoin(shows, eq(editions.showId, shows.id))
    .where(or(eq(editions.status, "upcoming"), eq(editions.status, "active")));

  return rows.map((r) => ({
    edition: mapEdition(r.edition),
    show: mapShow(r.show),
  }));
}

export async function pgGetArtist(slugOrId: string) {
  const db = requirePostgres();
  const artistRow = await db.query.artists.findFirst({
    where: or(eq(artists.slug, slugOrId), eq(artists.id, slugOrId)),
  });
  if (!artistRow) return null;
  const artist = mapArtist(artistRow);

  const userRow = await db.query.users.findFirst({ where: eq(users.id, artist.userId) });
  if (!userRow) return null;

  const [productRows, tierRows, appRows] = await Promise.all([
    db
      .select()
      .from(products)
      .where(and(eq(products.artistId, artist.id), eq(products.active, true))),
    db
      .select()
      .from(sponsorshipTiers)
      .where(and(eq(sponsorshipTiers.artistId, artist.id), eq(sponsorshipTiers.active, true))),
    db.select().from(applications).where(eq(applications.artistId, artist.id)),
  ]);

  return {
    artist,
    user: mapUser(userRow),
    products: productRows.map(mapProduct),
    tiers: tierRows.map(mapTier),
    posts: [] as DemoData["posts"],
    applications: appRows.map(mapApplication),
    bookings: [] as DemoData["bookings"],
    followers: 0,
  };
}

export async function pgListArtists() {
  const db = requirePostgres();
  const rows = await db
    .select({ artist: artists, user: users })
    .from(artists)
    .innerJoin(users, eq(artists.userId, users.id));

  return rows.map((r) => ({
    artist: mapArtist(r.artist),
    user: mapUser(r.user),
    followers: 0,
  }));
}

export async function pgGetApplicationsForArtist(artistId: string) {
  const db = requirePostgres();
  const rows = await db
    .select({ app: applications, edition: editions, show: shows })
    .from(applications)
    .innerJoin(editions, eq(applications.editionId, editions.id))
    .innerJoin(shows, eq(editions.showId, shows.id))
    .where(eq(applications.artistId, artistId));

  return rows
    .map((r) => ({
      app: mapApplication(r.app),
      edition: mapEdition(r.edition),
      show: mapShow(r.show),
    }))
    .sort((a, b) =>
      (a.edition.applicationDeadline ?? "").localeCompare(b.edition.applicationDeadline ?? ""),
    );
}

export async function pgUpsertApplication(input: {
  artistId: string;
  editionId: string;
  status: ApplicationStatus;
  officialApplyUrl: string;
  notes?: string;
}) {
  const db = requirePostgres();
  const now = new Date();
  const existing = await db.query.applications.findFirst({
    where: and(
      eq(applications.artistId, input.artistId),
      eq(applications.editionId, input.editionId),
    ),
  });
  const edition = await db.query.editions.findFirst({
    where: eq(editions.id, input.editionId),
  });
  const reminderAt = reminderFromDeadline(edition?.applicationDeadline);

  if (existing) {
    const appliedAt =
      input.status === "applied" && !existing.appliedAt ? now : existing.appliedAt;
    const [updated] = await db
      .update(applications)
      .set({
        status: input.status,
        notes: input.notes ?? null,
        officialApplyUrl: input.officialApplyUrl || existing.officialApplyUrl,
        updatedAt: now,
        reminderAt: existing.reminderAt ?? reminderAt ?? null,
        appliedAt: appliedAt ?? null,
      })
      .where(eq(applications.id, existing.id))
      .returning();
    return mapApplication(updated!);
  }

  let officialApplyUrl = input.officialApplyUrl;
  if (!officialApplyUrl && edition) {
    const show = await db.query.shows.findFirst({ where: eq(shows.id, edition.showId) });
    if (show) {
      officialApplyUrl = `${show.officialWebsiteUrl.replace(/\/$/, "")}/apply`;
    }
  }

  const row = {
    id: `app_${nanoid(8)}`,
    artistId: input.artistId,
    editionId: input.editionId,
    status: input.status,
    officialApplyUrl: officialApplyUrl || "",
    appliedAt: input.status === "applied" ? now : null,
    updatedAt: now,
    reminderAt: reminderAt ?? null,
    notes: input.notes ?? null,
  };
  await db.insert(applications).values(row);
  return mapApplication({ ...row, status: input.status });
}

export async function pgGetRoiForArtist(artistId: string) {
  const db = requirePostgres();
  const rows = await db
    .select({ report: roiReports, edition: editions, show: shows })
    .from(roiReports)
    .innerJoin(editions, eq(roiReports.editionId, editions.id))
    .innerJoin(shows, eq(editions.showId, shows.id))
    .where(eq(roiReports.artistId, artistId));

  return rows
    .map((r) => {
      const report = mapRoi(r.report);
      const edition = mapEdition(r.edition);
      const show = mapShow(r.show);
      const expenses =
        report.boothFee + report.travel + report.lodging + report.otherExpenses;
      return {
        report,
        edition,
        show,
        breakdowns: [] as RoiMediumBreakdown[],
        expenses,
        net: report.grossSales - expenses,
      };
    })
    .sort((a, b) => b.edition.startDate.localeCompare(a.edition.startDate));
}

export async function pgCreateRoiReport(input: {
  artistId: string;
  editionId: string;
  boothFee: number;
  travel: number;
  lodging: number;
  otherExpenses: number;
  grossSales: number;
  optInAggregate: boolean;
  hoursWorked?: number;
  notes?: string;
  breakdowns?: { medium: RoiMediumBreakdown["medium"]; sales: number; unitsSold: number }[];
}) {
  const db = requirePostgres();
  const now = new Date();
  const id = `roi_${nanoid(8)}`;
  const row = {
    id,
    artistId: input.artistId,
    editionId: input.editionId,
    boothFee: input.boothFee,
    travel: input.travel,
    lodging: input.lodging,
    otherExpenses: input.otherExpenses,
    grossSales: input.grossSales,
    currency: "USD",
    hoursWorked: input.hoursWorked ?? null,
    notes: input.notes ?? null,
    optInAggregate: input.optInAggregate,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(roiReports).values(row);

  const edition = await db.query.editions.findFirst({
    where: eq(editions.id, input.editionId),
  });
  if (edition) {
    await recomputeShowAggregate(edition.showId);
  }

  return mapRoi(row);
}

export async function pgGetShowRoiSignal(showId: string) {
  const db = requirePostgres();
  const showEditions = await db.select().from(editions).where(eq(editions.showId, showId));
  if (!showEditions.length) return null;
  const editionIds = showEditions.map((e) => e.id);
  const opted = await db
    .select()
    .from(roiReports)
    .where(and(eq(roiReports.optInAggregate, true), inArray(roiReports.editionId, editionIds)));
  if (!opted.length) return null;

  const nets = opted.map(netOf).sort((a, b) => a - b);
  const mid = nets[Math.floor(nets.length / 2)] ?? 0;
  const positiveShare = nets.filter((n) => n > 0).length / nets.length;

  const byYear = new Map<number, number[]>();
  for (const r of opted) {
    const ed = showEditions.find((e) => e.id === r.editionId);
    if (!ed) continue;
    const list = byYear.get(ed.year) ?? [];
    list.push(netOf(r));
    byYear.set(ed.year, list);
  }
  const yoy = [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, vals]) => {
      vals.sort((a, b) => a - b);
      return { year, medianNet: vals[Math.floor(vals.length / 2)] ?? 0, n: vals.length };
    });

  return {
    sampleSize: opted.length,
    medianNet: mid,
    positiveShare,
    worthApplying: opted.length >= 3 ? positiveShare >= 0.5 && mid > 0 : null,
    yoy,
    label: "self_reported" as const,
  };
}

export async function pgAddComment(editionId: string, authorUserId: string, body: string) {
  const db = requirePostgres();
  const now = new Date();
  const row = {
    id: nanoid(10),
    editionId,
    authorUserId,
    body,
    createdAt: now,
  };
  await db.insert(showComments).values(row);
  return mapComment(row);
}

export async function pgClaimShow(input: {
  userId: string;
  showId: string;
  contactEmail: string;
}) {
  const db = requirePostgres();
  const showRow = await db.query.shows.findFirst({ where: eq(shows.id, input.showId) });
  if (!showRow) throw new Error("Show not found");
  const show = mapShow(showRow);

  const domain = (() => {
    try {
      return new URL(show.officialWebsiteUrl).hostname.replace(/^www\./, "");
    } catch {
      return undefined;
    }
  })();
  const emailDomain = input.contactEmail.split("@")[1]?.toLowerCase();
  const autoVerify = Boolean(domain && emailDomain && emailDomain === domain);
  const now = new Date();

  let directorRow = await db.query.directors.findFirst({
    where: eq(directors.userId, input.userId),
  });

  if (!directorRow) {
    const created: DirectorRow = {
      id: `dir_${nanoid(8)}`,
      userId: input.userId,
      showIds: [input.showId],
      verified: autoVerify,
      verifiedDomain: autoVerify ? (domain ?? null) : null,
      verifiedAt: autoVerify ? now : null,
      stripeConnectAccountId: null,
    };
    await db.insert(directors).values(created);
    directorRow = created;
  } else {
    const showIds = [...(directorRow.showIds ?? [])];
    if (!showIds.includes(input.showId)) showIds.push(input.showId);
    const patch: Pick<
      DirectorRow,
      "showIds" | "verified" | "verifiedDomain" | "verifiedAt"
    > = {
      showIds,
      verified: autoVerify && !directorRow.verified ? true : directorRow.verified,
      verifiedDomain:
        autoVerify && !directorRow.verified
          ? (domain ?? null)
          : directorRow.verifiedDomain,
      verifiedAt:
        autoVerify && !directorRow.verified ? now : directorRow.verifiedAt,
    };
    await db.update(directors).set(patch).where(eq(directors.id, directorRow.id));
    directorRow = { ...directorRow, ...patch };
  }

  const userRow = await db.query.users.findFirst({ where: eq(users.id, input.userId) });
  if (userRow) {
    const roles = [...((userRow.roles as UserRole[]) ?? [])];
    if (!roles.includes("director")) {
      roles.push("director");
      await db.update(users).set({ roles, updatedAt: now }).where(eq(users.id, userRow.id));
    }
  }

  return { director: mapDirector(directorRow!), autoVerify, domain };
}

export async function pgListClaimableShows() {
  const db = requirePostgres();
  const rows = await db.select().from(shows).orderBy(asc(shows.name));
  return rows.map(mapShow);
}

export async function pgGetDirectorDashboard(userId: string) {
  const db = requirePostgres();
  const directorRow = await db.query.directors.findFirst({
    where: eq(directors.userId, userId),
  });
  if (!directorRow) return null;
  const director = mapDirector(directorRow);
  if (!director.showIds.length) {
    return {
      director,
      shows: [] as Show[],
      editions: [] as ShowEdition[],
      announcements: [] as DirectorAnnouncement[],
      waitlist: [] as WaitlistListing[],
      promotions: [] as PromotedListing[],
    };
  }

  const showRows = await db.select().from(shows).where(inArray(shows.id, director.showIds));
  const mappedShows = showRows.map(mapShow);
  const editionRows = await db
    .select()
    .from(editions)
    .where(
      and(
        inArray(editions.showId, director.showIds),
        or(eq(editions.status, "upcoming"), eq(editions.status, "active")),
      ),
    );
  const mappedEditions = editionRows.map(mapEdition);
  const editionIds = mappedEditions.map((e) => e.id);

  const [announcementRows, waitlistRows, promotionRows] = await Promise.all([
    editionIds.length
      ? db.select().from(announcements).where(inArray(announcements.editionId, editionIds))
      : Promise.resolve([] as AnnouncementRow[]),
    editionIds.length
      ? db.select().from(waitlistBooths).where(inArray(waitlistBooths.editionId, editionIds))
      : Promise.resolve([] as WaitlistRow[]),
    db.select().from(promotions).where(inArray(promotions.showId, director.showIds)),
  ]);

  return {
    director,
    shows: mappedShows,
    editions: mappedEditions,
    announcements: announcementRows.map(mapAnnouncement),
    waitlist: waitlistRows.map(mapWaitlist),
    promotions: promotionRows.map(mapPromotion),
  };
}

export async function pgCreateAnnouncement(input: {
  editionId: string;
  directorUserId: string;
  title: string;
  body: string;
  kind: DemoData["announcements"][0]["kind"];
}) {
  const db = requirePostgres();
  const now = new Date();
  const row = {
    id: nanoid(10),
    editionId: input.editionId,
    directorUserId: input.directorUserId,
    title: input.title,
    body: input.body,
    kind: input.kind,
    createdAt: now,
  };
  await db.insert(announcements).values(row);
  return mapAnnouncement(row);
}

export async function pgOpenWaitlistBooth(editionId: string, boothLabel?: string) {
  const db = requirePostgres();
  const now = new Date();
  const row = {
    id: nanoid(10),
    editionId,
    boothLabel: boothLabel ?? null,
    status: "open",
    createdAt: now,
  };
  await db.insert(waitlistBooths).values(row);
  return mapWaitlist(row);
}

export async function pgGetEditionOptions(): Promise<
  { edition: ShowEdition; showName: string }[]
> {
  const db = requirePostgres();
  const rows = await db
    .select({ edition: editions, showName: shows.name })
    .from(editions)
    .innerJoin(shows, eq(editions.showId, shows.id))
    .where(gte(editions.year, 2025))
    .orderBy(asc(editions.startDate));

  return rows.map((r) => ({
    edition: mapEdition(r.edition),
    showName: r.showName,
  }));
}

export async function pgListJuryFeedback() {
  const db = requirePostgres();
  const rows = await db
    .select({
      row: juryFeedback,
      artist: artists,
      edition: editions,
      show: shows,
    })
    .from(juryFeedback)
    .innerJoin(artists, eq(juryFeedback.artistId, artists.id))
    .innerJoin(editions, eq(juryFeedback.editionId, editions.id))
    .innerJoin(shows, eq(editions.showId, shows.id))
    .orderBy(desc(juryFeedback.createdAt));

  return rows.map((r) => ({
    row: mapJury(r.row),
    artist: mapArtist(r.artist),
    edition: mapEdition(r.edition),
    show: mapShow(r.show),
  }));
}

export async function pgCreateJuryFeedback(input: {
  artistId: string;
  editionId: string;
  outcome: "accepted" | "waitlisted" | "declined";
  notes?: string;
  imageUrls?: string[];
}) {
  const db = requirePostgres();
  const now = new Date();
  const row = {
    id: nanoid(10),
    artistId: input.artistId,
    editionId: input.editionId,
    imageUrls: input.imageUrls ?? [],
    outcome: input.outcome,
    notes: input.notes ?? null,
    createdAt: now,
  };
  await db.insert(juryFeedback).values(row);
  return mapJury(row);
}

export async function pgListBoothSit() {
  const db = requirePostgres();
  const [offerRows, requestRows] = await Promise.all([
    db.select().from(boothOffers),
    db.select().from(boothRequests),
  ]);

  const editionIds = [
    ...new Set([
      ...offerRows.map((o) => o.editionId),
      ...requestRows.map((r) => r.editionId),
    ]),
  ];
  const artistIds = [
    ...new Set([
      ...offerRows.map((o) => o.artistId),
      ...requestRows.map((r) => r.artistId),
    ]),
  ];

  const [editionRows, artistRows, showRows] = await Promise.all([
    editionIds.length
      ? db.select().from(editions).where(inArray(editions.id, editionIds))
      : Promise.resolve([] as EditionRow[]),
    artistIds.length
      ? db.select().from(artists).where(inArray(artists.id, artistIds))
      : Promise.resolve([] as ArtistRow[]),
    db.select().from(shows),
  ]);

  const editionMap = new Map(editionRows.map((e) => [e.id, mapEdition(e)]));
  const artistMap = new Map(artistRows.map((a) => [a.id, mapArtist(a)]));
  const showMap = new Map(showRows.map((s) => [s.id, mapShow(s)]));

  const resolve = (editionId: string, artistId: string) => {
    const edition = editionMap.get(editionId)!;
    const show = showMap.get(edition.showId)!;
    const artist = artistMap.get(artistId)!;
    return { edition, show, artist };
  };

  return {
    offers: offerRows.map((o) => ({
      offer: mapBoothOffer(o),
      ...resolve(o.editionId, o.artistId),
    })),
    requests: requestRows.map((r) => ({
      request: mapBoothRequest(r),
      ...resolve(r.editionId, r.artistId),
    })),
  };
}

export async function pgCreateBoothOffer(input: {
  artistId: string;
  editionId: string;
  availableWindows: string;
  notes?: string;
}) {
  const db = requirePostgres();
  const row = {
    id: nanoid(10),
    artistId: input.artistId,
    editionId: input.editionId,
    availableWindows: input.availableWindows,
    notes: input.notes ?? null,
  };
  await db.insert(boothOffers).values(row);
  return mapBoothOffer(row);
}

export async function pgCreateBoothRequest(input: {
  artistId: string;
  editionId: string;
  neededWindow: string;
}) {
  const db = requirePostgres();
  const row = {
    id: nanoid(10),
    artistId: input.artistId,
    editionId: input.editionId,
    neededWindow: input.neededWindow,
    status: "open",
  };
  await db.insert(boothRequests).values(row);
  return mapBoothRequest(row);
}

export async function pgListAlerts(artistId?: string | null) {
  const db = requirePostgres();
  type AlertRow = {
    kind: "operational" | "deadline";
    id: string;
    alertKind: string;
    title: string;
    body: string;
    createdAt: string;
    edition: ShowEdition;
    show: Show;
    dueAt?: string;
    href: string;
  };

  const operational: AlertRow[] = [];
  const deadlineRows: AlertRow[] = [];

  if (artistId) {
    const appRows = await db
      .select({ app: applications, edition: editions, show: shows })
      .from(applications)
      .innerJoin(editions, eq(applications.editionId, editions.id))
      .innerJoin(shows, eq(editions.showId, shows.id))
      .where(eq(applications.artistId, artistId));

    const now = Date.now();
    const horizonMs = 1000 * 60 * 60 * 24 * 60;
    for (const r of appRows) {
      const app = mapApplication(r.app);
      if (["declined", "withdrawn", "accepted"].includes(app.status)) continue;
      const edition = mapEdition(r.edition);
      const show = mapShow(r.show);
      if (!edition.applicationDeadline) continue;
      const due = new Date(`${edition.applicationDeadline}T23:59:59Z`).getTime();
      if (Number.isNaN(due)) continue;
      const delta = due - now;
      if (delta < -1000 * 60 * 60 * 24 || delta > horizonMs) continue;
      const days = Math.ceil(delta / (1000 * 60 * 60 * 24));
      deadlineRows.push({
        kind: "deadline",
        id: `deadline_${app.id}`,
        alertKind: "deadline",
        title:
          days < 0
            ? `Deadline passed · ${show.name}`
            : days === 0
              ? `Apply today · ${show.name}`
              : `Deadline in ${days} day${days === 1 ? "" : "s"} · ${show.name}`,
        body: `Your tracker is “${app.status}”. Official deadline ${edition.applicationDeadline}.${
          app.reminderAt ? ` Reminder set for ${app.reminderAt.slice(0, 10)}.` : ""
        }`,
        createdAt: app.reminderAt ?? app.updatedAt,
        edition,
        show,
        dueAt: edition.applicationDeadline,
        href: `/applications`,
      });
    }
    deadlineRows.sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));
  }

  return [...deadlineRows, ...operational];
}

export async function pgStats() {
  const db = requirePostgres();
  const [showCount, editionCount, artistCount, roiCount, appCount, aggReady] =
    await Promise.all([
      db.select().from(shows).then((r) => r.length),
      db.select().from(editions).then((r) => r.length),
      db.select().from(artists).then((r) => r.length),
      db.select().from(roiReports).then((r) => r.length),
      db.select().from(applications).then((r) => r.length),
      db
        .select()
        .from(showAggregates)
        .where(eq(showAggregates.minNMet, true))
        .then((r) => r.length),
    ]);

  return {
    shows: showCount,
    editions: editionCount,
    artists: artistCount,
    roiReports: roiCount,
    applications: appCount,
    aggregatesReady: aggReady,
  };
}

export async function pgRegisterUser(input: {
  name: string;
  email: string;
  password: string;
  roles: UserRole[];
}) {
  const db = requirePostgres();
  const now = new Date();
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hash(input.password, 10);
  const roles = input.roles.length ? input.roles : (["showgoer"] as UserRole[]);
  const userId = `user_${nanoid(10)}`;

  await db.insert(users).values({
    id: userId,
    name: input.name.trim(),
    email,
    passwordHash,
    roles,
    createdAt: now,
    updatedAt: now,
  });

  let artist: ArtistProfile | null = null;
  if (roles.includes("artist")) {
    const base = slugify(input.name);
    let slug = base;
    const clash = await db.query.artists.findFirst({ where: eq(artists.slug, slug) });
    if (clash) slug = `${base}-${nanoid(4)}`;
    const artistId = `artist_${nanoid(8)}`;
    const artistRow = {
      id: artistId,
      userId,
      slug,
      displayName: input.name.trim(),
      tagline: "",
      bio: "",
      mediums: [] as string[],
      portfolioUrls: [] as string[],
      boothDefaultSize: null as string | null,
      city: "",
      region: "",
      stripeConnectAccountId: null as string | null,
      stripeConnectReady: false,
      createdAt: now,
    };
    await db.insert(artists).values(artistRow);
    artist = mapArtist(artistRow);
  }

  const userRow = await db.query.users.findFirst({ where: eq(users.id, userId) });
  return { user: mapUser(userRow!), artist };
}
