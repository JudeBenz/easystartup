import { nanoid } from "nanoid";
import type {
  Application,
  ApplicationStatus,
  DemoData,
  RoiMediumBreakdown,
  RoiReport,
  ShowComment,
  ShowEdition,
} from "@/types/domain";
import { getDb, mutateDb, resetDb } from "./db";
import { computeAggregates, MIN_N } from "./seed";
import { haversineMiles } from "@/lib/format";
import { isPostgresEnabled } from "@/lib/db/client";
import * as pg from "./pg-repo";

export { MIN_N, resetDb };

export async function listShows() {
  if (isPostgresEnabled()) return pg.pgListShows();
  const db = await getDb();
  return db.shows
    .map((show) => {
      const editions = db.editions
        .filter((e) => e.showId === show.id)
        .sort((a, b) => b.year - a.year);
      const current =
        editions.find((e) => e.status === "upcoming" || e.status === "active") ?? editions[0];
      const agg = db.aggregates
        .filter((a) => a.showId === show.id && a.minNMet)
        .sort((a, b) => (b.medianNet ?? 0) - (a.medianNet ?? 0))[0];
      return { show, current, editions, aggregate: agg, promoted: Boolean(show.promotedUntil) };
    })
    .sort((a, b) => {
      if (a.promoted !== b.promoted) return a.promoted ? -1 : 1;
      return a.show.name.localeCompare(b.show.name);
    });
}

export async function getShowBySlug(slug: string) {
  if (isPostgresEnabled()) return pg.pgGetShowBySlug(slug);
  const db = await getDb();
  const show = db.shows.find((s) => s.slug === slug);
  if (!show) return null;
  const editions = db.editions
    .filter((e) => e.showId === show.id)
    .sort((a, b) => b.year - a.year);
  const current =
    editions.find((e) => e.status === "upcoming" || e.status === "active") ?? editions[0];
  const socialLinks = db.socialLinks.filter((l) => editions.some((e) => e.id === l.editionId));
  const externalRefs = db.externalRefs.filter((r) => r.showId === show.id);
  const provenance = db.provenance.filter((p) => editions.some((e) => e.id === p.entityId));
  const aggregates = db.aggregates.filter((a) => a.showId === show.id);
  const comments = current
    ? db.comments.filter((c) => c.editionId === current.id)
    : [];
  const announcements = current
    ? db.announcements.filter((a) => a.editionId === current.id)
    : [];
  const alerts = current ? db.alerts.filter((a) => a.editionId === current.id) : [];
  const weather = current ? db.weather.filter((w) => w.editionId === current.id) : [];
  const waitlist = current ? db.waitlist.filter((w) => w.editionId === current.id) : [];
  const boothOffers = current ? db.boothOffers.filter((b) => b.editionId === current.id) : [];
  const boothRequests = current
    ? db.boothRequests.filter((b) => b.editionId === current.id)
    : [];
  return {
    show,
    editions,
    current,
    socialLinks,
    externalRefs,
    provenance,
    aggregates,
    comments,
    announcements,
    alerts,
    weather,
    waitlist,
    boothOffers,
    boothRequests,
  };
}

export async function listEditionsForCalendar() {
  if (isPostgresEnabled()) return pg.pgListEditionsForCalendar();
  const db = await getDb();
  return db.editions
    .filter((e) => e.status === "upcoming" || e.status === "active")
    .map((edition) => ({
      edition,
      show: db.shows.find((s) => s.id === edition.showId)!,
    }));
}

export async function listShowsNear(lat: number, lng: number, radiusMiles: number) {
  const rows = await listShows();
  return rows
    .map((row) => ({
      ...row,
      distanceMiles: haversineMiles({ lat, lng }, row.show.geo),
    }))
    .filter((r) => r.distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}

export async function listRankedShows() {
  const rows = await listShows();
  return rows
    .filter((r) => r.aggregate?.minNMet)
    .sort((a, b) => (b.aggregate?.medianNet ?? 0) - (a.aggregate?.medianNet ?? 0));
}

export async function getArtist(slugOrId: string) {
  if (isPostgresEnabled()) return pg.pgGetArtist(slugOrId);
  const db = await getDb();
  const artist =
    db.artists.find((a) => a.slug === slugOrId || a.id === slugOrId) ?? null;
  if (!artist) return null;
  const user = db.users.find((u) => u.id === artist.userId)!;
  const products = db.products.filter((p) => p.artistId === artist.id && p.active);
  const tiers = db.sponsorshipTiers.filter((t) => t.artistId === artist.id && t.active);
  const posts = db.posts.filter((p) => p.artistId === artist.id);
  const applications = db.applications.filter((a) => a.artistId === artist.id);
  const bookings = db.bookings.filter((b) => b.artistId === artist.id);
  const followers = db.follows.filter((f) => f.artistId === artist.id).length;
  return { artist, user, products, tiers, posts, applications, bookings, followers, db };
}

export async function listArtists() {
  if (isPostgresEnabled()) return pg.pgListArtists();
  const db = await getDb();
  return db.artists.map((artist) => ({
    artist,
    user: db.users.find((u) => u.id === artist.userId)!,
    followers: db.follows.filter((f) => f.artistId === artist.id).length,
  }));
}

export async function getApplicationsForArtist(artistId: string) {
  if (isPostgresEnabled()) return pg.pgGetApplicationsForArtist(artistId);
  const db = await getDb();
  return db.applications
    .filter((a) => a.artistId === artistId)
    .map((app) => {
      const edition = db.editions.find((e) => e.id === app.editionId)!;
      const show = db.shows.find((s) => s.id === edition.showId)!;
      return { app, edition, show };
    })
    .sort((a, b) => (a.edition.applicationDeadline ?? "").localeCompare(b.edition.applicationDeadline ?? ""));
}

function reminderFromDeadline(deadline?: string) {
  if (!deadline) return undefined;
  const d = new Date(`${deadline}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setUTCDate(d.getUTCDate() - 14);
  return d.toISOString();
}

export async function upsertApplication(input: {
  artistId: string;
  editionId: string;
  status: ApplicationStatus;
  officialApplyUrl: string;
  notes?: string;
}) {
  if (isPostgresEnabled()) return pg.pgUpsertApplication(input);
  return mutateDb((db) => {
    const existing = db.applications.find(
      (a) => a.artistId === input.artistId && a.editionId === input.editionId,
    );
    const edition = db.editions.find((e) => e.id === input.editionId);
    const now = new Date().toISOString();
    const reminderAt = reminderFromDeadline(edition?.applicationDeadline);
    if (existing) {
      existing.status = input.status;
      existing.notes = input.notes;
      existing.officialApplyUrl = input.officialApplyUrl || existing.officialApplyUrl;
      existing.updatedAt = now;
      if (!existing.reminderAt && reminderAt) existing.reminderAt = reminderAt;
      if (input.status === "applied" && !existing.appliedAt) existing.appliedAt = now;
      return existing;
    }
    const show = edition ? db.shows.find((s) => s.id === edition.showId) : undefined;
    const app: Application = {
      id: `app_${nanoid(8)}`,
      artistId: input.artistId,
      editionId: input.editionId,
      status: input.status,
      officialApplyUrl:
        input.officialApplyUrl ||
        (show ? `${show.officialWebsiteUrl.replace(/\/$/, "")}/apply` : ""),
      appliedAt: input.status === "applied" ? now : undefined,
      updatedAt: now,
      reminderAt,
      notes: input.notes,
    };
    db.applications.push(app);
    return app;
  });
}

export async function getRoiForArtist(artistId: string) {
  if (isPostgresEnabled()) return pg.pgGetRoiForArtist(artistId);
  const db = await getDb();
  return db.roiReports
    .filter((r) => r.artistId === artistId)
    .map((report) => {
      const edition = db.editions.find((e) => e.id === report.editionId)!;
      const show = db.shows.find((s) => s.id === edition.showId)!;
      const breakdowns = db.roiBreakdowns.filter((b) => b.reportId === report.id);
      const expenses =
        report.boothFee + report.travel + report.lodging + report.otherExpenses;
      return {
        report,
        edition,
        show,
        breakdowns,
        expenses,
        net: report.grossSales - expenses,
      };
    })
    .sort((a, b) => b.edition.startDate.localeCompare(a.edition.startDate));
}

export async function createRoiReport(input: {
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
  if (isPostgresEnabled()) return pg.pgCreateRoiReport(input);
  return mutateDb((db) => {
    const now = new Date().toISOString();
    const report: RoiReport = {
      id: `roi_${nanoid(8)}`,
      artistId: input.artistId,
      editionId: input.editionId,
      boothFee: input.boothFee,
      travel: input.travel,
      lodging: input.lodging,
      otherExpenses: input.otherExpenses,
      grossSales: input.grossSales,
      currency: "USD",
      hoursWorked: input.hoursWorked,
      optInAggregate: input.optInAggregate,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    db.roiReports.push(report);
    for (const b of input.breakdowns ?? []) {
      db.roiBreakdowns.push({
        id: nanoid(8),
        reportId: report.id,
        ...b,
      });
    }
    db.aggregates = computeAggregates(db.roiReports, db.roiBreakdowns, db.editions, db.shows);
    return report;
  });
}

/** Peer signal for a show: opted-in self-reported nets only (no aggregator data). */
export async function getShowRoiSignal(showId: string) {
  if (isPostgresEnabled()) return pg.pgGetShowRoiSignal(showId);
  const db = await getDb();
  const editionIds = new Set(db.editions.filter((e) => e.showId === showId).map((e) => e.id));
  const opted = db.roiReports.filter((r) => r.optInAggregate && editionIds.has(r.editionId));
  if (!opted.length) return null;
  const nets = opted.map((r) => {
    const expenses = r.boothFee + r.travel + r.lodging + r.otherExpenses;
    return r.grossSales - expenses;
  });
  nets.sort((a, b) => a - b);
  const mid = nets[Math.floor(nets.length / 2)] ?? 0;
  const positiveShare = nets.filter((n) => n > 0).length / nets.length;
  const byYear = new Map<number, number[]>();
  for (const r of opted) {
    const ed = db.editions.find((e) => e.id === r.editionId);
    if (!ed) continue;
    const expenses = r.boothFee + r.travel + r.lodging + r.otherExpenses;
    const list = byYear.get(ed.year) ?? [];
    list.push(r.grossSales - expenses);
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

export async function listRoutes() {
  const db = await getDb();
  return db.routes.map((route) => {
    const stops = db.routeStops
      .filter((s) => s.routeId === route.id)
      .sort((a, b) => a.order - b.order)
      .map((stop) => {
        const edition = db.editions.find((e) => e.id === stop.editionId)!;
        const show = db.shows.find((s) => s.id === edition.showId)!;
        return { stop, edition, show };
      });
    return { route, stops };
  });
}

export async function getFeed() {
  const db = await getDb();
  return db.posts
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((post) => {
      const author = db.users.find((u) => u.id === post.authorUserId)!;
      const artist = post.artistId
        ? db.artists.find((a) => a.id === post.artistId)
        : undefined;
      const edition = post.editionId
        ? db.editions.find((e) => e.id === post.editionId)
        : undefined;
      const show = edition ? db.shows.find((s) => s.id === edition.showId) : undefined;
      return { post, author, artist, edition, show };
    });
}

export async function addComment(editionId: string, authorUserId: string, body: string) {
  if (isPostgresEnabled()) return pg.pgAddComment(editionId, authorUserId, body);
  return mutateDb((db) => {
    const comment: ShowComment = {
      id: nanoid(10),
      editionId,
      authorUserId,
      body,
      createdAt: new Date().toISOString(),
    };
    db.comments.push(comment);
    return comment;
  });
}

export async function getPersonalCalendar(artistId: string) {
  const db = await getDb();
  return db.bookings
    .filter((b) => b.artistId === artistId)
    .map((booking) => {
      const edition = db.editions.find((e) => e.id === booking.editionId)!;
      const show = db.shows.find((s) => s.id === edition.showId)!;
      return { booking, edition, show };
    })
    .sort((a, b) => a.edition.startDate.localeCompare(b.edition.startDate));
}

export async function getWeekendMode(showSlug: string, showgoerUserId: string) {
  const detail = await getShowBySlug(showSlug);
  if (!detail?.current) return null;
  const db = await getDb();
  const followed = db.follows
    .filter((f) => f.followerUserId === showgoerUserId)
    .map((f) => f.artistId);
  const artistsHere = db.applications
    .filter(
      (a) =>
        a.editionId === detail.current!.id &&
        (a.status === "accepted" || a.status === "waitlisted") &&
        followed.includes(a.artistId),
    )
    .map((a) => db.artists.find((x) => x.id === a.artistId)!);
  const favorites = db.showgoers.find((s) => s.userId === showgoerUserId)?.favoriteShowIds ?? [];
  return {
    ...detail,
    artistsYouFollow: artistsHere,
    isFavorite: favorites.includes(detail.show.id),
  };
}

export async function listUsers() {
  const { pgListUsers } = await import("./pg-users");
  const fromPg = await pgListUsers();
  if (fromPg) return fromPg;
  const db = await getDb();
  return db.users;
}

export async function getUser(id: string) {
  const { pgGetUser } = await import("./pg-users");
  const fromPg = await pgGetUser(id);
  if (fromPg !== undefined) return fromPg;
  const db = await getDb();
  return db.users.find((u) => u.id === id) ?? null;
}

export async function getArtistIdForUser(userId: string) {
  const { pgGetArtistIdForUser } = await import("./pg-users");
  const fromPg = await pgGetArtistIdForUser(userId);
  if (fromPg !== undefined) return fromPg;
  const db = await getDb();
  return db.artists.find((a) => a.userId === userId)?.id ?? null;
}

export async function claimShow(input: {
  userId: string;
  showId: string;
  contactEmail: string;
}) {
  if (isPostgresEnabled()) return pg.pgClaimShow(input);
  return mutateDb((db) => {
    const show = db.shows.find((s) => s.id === input.showId);
    if (!show) throw new Error("Show not found");
    let director = db.directors.find((d) => d.userId === input.userId);
    const domain = (() => {
      try {
        return new URL(show.officialWebsiteUrl).hostname.replace(/^www\./, "");
      } catch {
        return undefined;
      }
    })();
    const emailDomain = input.contactEmail.split("@")[1]?.toLowerCase();
    const autoVerify = Boolean(domain && emailDomain && emailDomain === domain);
    if (!director) {
      director = {
        id: `dir_${nanoid(8)}`,
        userId: input.userId,
        showIds: [input.showId],
        verified: autoVerify,
        verifiedDomain: autoVerify ? domain : undefined,
        verifiedAt: autoVerify ? new Date().toISOString() : undefined,
      };
      db.directors.push(director);
    } else if (!director.showIds.includes(input.showId)) {
      director.showIds.push(input.showId);
      if (autoVerify && !director.verified) {
        director.verified = true;
        director.verifiedDomain = domain;
        director.verifiedAt = new Date().toISOString();
      }
    }
    const user = db.users.find((u) => u.id === input.userId);
    if (user && !user.roles.includes("director")) user.roles.push("director");
    return { director, autoVerify, domain };
  });
}

export async function listClaimableShows() {
  if (isPostgresEnabled()) return pg.pgListClaimableShows();
  const db = await getDb();
  return db.shows.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export async function getDirectorDashboard(userId: string) {
  if (isPostgresEnabled()) return pg.pgGetDirectorDashboard(userId);
  const db = await getDb();
  const director = db.directors.find((d) => d.userId === userId);
  if (!director) return null;
  const shows = db.shows.filter((s) => director.showIds.includes(s.id));
  const editions = db.editions.filter(
    (e) =>
      shows.some((s) => s.id === e.showId) &&
      (e.status === "upcoming" || e.status === "active"),
  );
  const announcements = db.announcements.filter((a) =>
    editions.some((e) => e.id === a.editionId),
  );
  const waitlist = db.waitlist.filter((w) => editions.some((e) => e.id === w.editionId));
  const promotions = db.promotions.filter((p) => director.showIds.includes(p.showId));
  return { director, shows, editions, announcements, waitlist, promotions };
}

export async function createAnnouncement(input: {
  editionId: string;
  directorUserId: string;
  title: string;
  body: string;
  kind: DemoData["announcements"][0]["kind"];
}) {
  if (isPostgresEnabled()) return pg.pgCreateAnnouncement(input);
  return mutateDb((db) => {
    const row = {
      id: nanoid(10),
      ...input,
      createdAt: new Date().toISOString(),
    };
    db.announcements.push(row);
    return row;
  });
}

export async function openWaitlistBooth(editionId: string, boothLabel?: string) {
  if (isPostgresEnabled()) return pg.pgOpenWaitlistBooth(editionId, boothLabel);
  return mutateDb((db) => {
    const row = {
      id: nanoid(10),
      editionId,
      boothLabel,
      status: "open" as const,
      createdAt: new Date().toISOString(),
    };
    db.waitlist.push(row);
    return row;
  });
}

export async function getEditionOptions(): Promise<{ edition: ShowEdition; showName: string }[]> {
  if (isPostgresEnabled()) return pg.pgGetEditionOptions();
  const db = await getDb();
  return db.editions
    .filter((e) => e.year >= 2025)
    .map((edition) => ({
      edition,
      showName: db.shows.find((s) => s.id === edition.showId)!.name,
    }))
    .sort((a, b) => a.edition.startDate.localeCompare(b.edition.startDate));
}

export async function listJuryFeedback() {
  if (isPostgresEnabled()) return pg.pgListJuryFeedback();
  const db = await getDb();
  return db.juryFeedback
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((row) => {
      const artist = db.artists.find((a) => a.id === row.artistId)!;
      const edition = db.editions.find((e) => e.id === row.editionId)!;
      const show = db.shows.find((s) => s.id === edition.showId)!;
      return { row, artist, edition, show };
    });
}

export async function createJuryFeedback(input: {
  artistId: string;
  editionId: string;
  outcome: "accepted" | "waitlisted" | "declined";
  notes?: string;
  imageUrls?: string[];
}) {
  if (isPostgresEnabled()) return pg.pgCreateJuryFeedback(input);
  return mutateDb((db) => {
    const row = {
      id: nanoid(10),
      artistId: input.artistId,
      editionId: input.editionId,
      imageUrls: input.imageUrls ?? [],
      outcome: input.outcome,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };
    db.juryFeedback.push(row);
    return row;
  });
}

export async function listBoothSit() {
  if (isPostgresEnabled()) return pg.pgListBoothSit();
  const db = await getDb();
  const resolve = (editionId: string, artistId: string) => {
    const edition = db.editions.find((e) => e.id === editionId)!;
    const show = db.shows.find((s) => s.id === edition.showId)!;
    const artist = db.artists.find((a) => a.id === artistId)!;
    return { edition, show, artist };
  };
  return {
    offers: db.boothOffers.map((o) => ({ offer: o, ...resolve(o.editionId, o.artistId) })),
    requests: db.boothRequests.map((r) => ({ request: r, ...resolve(r.editionId, r.artistId) })),
  };
}

export async function createBoothOffer(input: {
  artistId: string;
  editionId: string;
  availableWindows: string;
  notes?: string;
}) {
  if (isPostgresEnabled()) return pg.pgCreateBoothOffer(input);
  return mutateDb((db) => {
    const row = { id: nanoid(10), ...input };
    db.boothOffers.push(row);
    return row;
  });
}

export async function createBoothRequest(input: {
  artistId: string;
  editionId: string;
  neededWindow: string;
}) {
  if (isPostgresEnabled()) return pg.pgCreateBoothRequest(input);
  return mutateDb((db) => {
    const row = {
      id: nanoid(10),
      ...input,
      status: "open" as const,
    };
    db.boothRequests.push(row);
    return row;
  });
}

export async function listAlerts(artistId?: string | null) {
  if (isPostgresEnabled()) return pg.pgListAlerts(artistId);
  const db = await getDb();
  type AlertRow = {
    kind: "operational" | "deadline";
    id: string;
    alertKind: string;
    title: string;
    body: string;
    createdAt: string;
    edition: (typeof db.editions)[number];
    show: (typeof db.shows)[number];
    dueAt?: string;
    href: string;
  };

  const operational: AlertRow[] = db.alerts
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((alert) => {
      const edition = db.editions.find((e) => e.id === alert.editionId)!;
      const show = db.shows.find((s) => s.id === edition.showId)!;
      return {
        kind: "operational" as const,
        id: alert.id,
        alertKind: alert.kind,
        title: alert.title,
        body: alert.body,
        createdAt: alert.createdAt,
        edition,
        show,
        dueAt: undefined,
        href: `/shows/${show.slug}`,
      };
    });

  const deadlineRows: AlertRow[] = [];
  if (artistId) {
    const now = Date.now();
    const horizonMs = 1000 * 60 * 60 * 24 * 60; // 60 days
    for (const app of db.applications.filter((a) => a.artistId === artistId)) {
      if (["declined", "withdrawn", "accepted"].includes(app.status)) continue;
      const edition = db.editions.find((e) => e.id === app.editionId);
      const show = edition ? db.shows.find((s) => s.id === edition.showId) : undefined;
      if (!edition || !show || !edition.applicationDeadline) continue;
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

export async function stats() {
  if (isPostgresEnabled()) return pg.pgStats();
  const db = await getDb();
  return {
    shows: db.shows.length,
    editions: db.editions.length,
    artists: db.artists.length,
    roiReports: db.roiReports.length,
    applications: db.applications.length,
    aggregatesReady: db.aggregates.filter((a) => a.minNMet).length,
  };
}
