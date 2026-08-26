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

export { MIN_N, resetDb };

export async function listShows() {
  const db = await getDb();
  return db.shows
    .map((show) => {
      const editions = db.editions
        .filter((e) => e.showId === show.id)
        .sort((a, b) => b.year - a.year);
      const current = editions.find((e) => e.year === 2026) ?? editions[0];
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
  const db = await getDb();
  const show = db.shows.find((s) => s.slug === slug);
  if (!show) return null;
  const editions = db.editions
    .filter((e) => e.showId === show.id)
    .sort((a, b) => b.year - a.year);
  const current = editions.find((e) => e.year === 2026) ?? editions[0];
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
  const db = await getDb();
  return db.editions
    .filter((e) => e.year === 2026)
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
  const db = await getDb();
  return db.artists.map((artist) => ({
    artist,
    user: db.users.find((u) => u.id === artist.userId)!,
    followers: db.follows.filter((f) => f.artistId === artist.id).length,
  }));
}

export async function getApplicationsForArtist(artistId: string) {
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

export async function upsertApplication(input: {
  artistId: string;
  editionId: string;
  status: ApplicationStatus;
  officialApplyUrl: string;
  notes?: string;
}) {
  return mutateDb((db) => {
    const existing = db.applications.find(
      (a) => a.artistId === input.artistId && a.editionId === input.editionId,
    );
    const now = new Date().toISOString();
    if (existing) {
      existing.status = input.status;
      existing.notes = input.notes;
      existing.updatedAt = now;
      if (input.status === "applied" && !existing.appliedAt) existing.appliedAt = now;
      return existing;
    }
    const app: Application = {
      id: `app_${nanoid(8)}`,
      artistId: input.artistId,
      editionId: input.editionId,
      status: input.status,
      officialApplyUrl: input.officialApplyUrl,
      appliedAt: input.status === "applied" ? now : undefined,
      updatedAt: now,
      notes: input.notes,
    };
    db.applications.push(app);
    return app;
  });
}

export async function getRoiForArtist(artistId: string) {
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
  notes?: string;
  breakdowns?: { medium: RoiMediumBreakdown["medium"]; sales: number; unitsSold: number }[];
}) {
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
  const db = await getDb();
  return db.users;
}

export async function getUser(id: string) {
  const db = await getDb();
  return db.users.find((u) => u.id === id) ?? null;
}

export async function getDirectorDashboard(userId: string) {
  const db = await getDb();
  const director = db.directors.find((d) => d.userId === userId);
  if (!director) return null;
  const shows = db.shows.filter((s) => director.showIds.includes(s.id));
  const editions = db.editions.filter((e) => shows.some((s) => s.id === e.showId) && e.year === 2026);
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
  const db = await getDb();
  return db.editions
    .filter((e) => e.year === 2026 || e.year === 2025)
    .map((edition) => ({
      edition,
      showName: db.shows.find((s) => s.id === edition.showId)!.name,
    }))
    .sort((a, b) => a.edition.startDate.localeCompare(b.edition.startDate));
}

export async function listJuryFeedback() {
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

export async function listAlerts() {
  const db = await getDb();
  return db.alerts
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((alert) => {
      const edition = db.editions.find((e) => e.id === alert.editionId)!;
      const show = db.shows.find((s) => s.id === edition.showId)!;
      return { alert, edition, show };
    });
}

export async function stats() {
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
