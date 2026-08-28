import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requirePostgres } from "@/lib/db/client";
import {
  applications,
  artistBookings,
  artists,
  boothOffers,
  directors,
  editions,
  favoriteShows,
  follows,
  orders,
  posts,
  products,
  routeStops,
  showAlerts,
  showRoutes,
  shows,
  sponsorshipTiers,
  users,
} from "@/lib/db/schema";
import type {
  ArtistShowBooking,
  Post,
  ShowAlert,
  ShowRoute,
  ShowRouteStop,
} from "@/types/domain";
import { mapArtist, mapEdition, mapShow, mapUser } from "./pg-repo";

export async function pgListRoutes() {
  const db = requirePostgres();
  const routes = await db.select().from(showRoutes);
  const stops = await db.select().from(routeStops);
  const editionIds = [...new Set(stops.map((s) => s.editionId))];
  const editionRows =
    editionIds.length > 0
      ? await db.select().from(editions).where(inArray(editions.id, editionIds))
      : [];
  const showIds = [...new Set(editionRows.map((e) => e.showId))];
  const showRows =
    showIds.length > 0 ? await db.select().from(shows).where(inArray(shows.id, showIds)) : [];

  return routes.map((route) => {
    const routeStopsList = stops
      .filter((s) => s.routeId === route.id)
      .sort((a, b) => a.order - b.order)
      .map((stop) => {
        const edition = editionRows.find((e) => e.id === stop.editionId)!;
        const show = showRows.find((s) => s.id === edition.showId)!;
        return {
          stop: {
            id: stop.id,
            routeId: stop.routeId,
            editionId: stop.editionId,
            order: stop.order,
            travelMilesFromPrev: stop.travelMilesFromPrev ?? undefined,
            travelHoursFromPrev: stop.travelHoursFromPrev ?? undefined,
          } satisfies ShowRouteStop,
          edition: mapEdition(edition),
          show: mapShow(show),
        };
      });
    return {
      route: {
        id: route.id,
        slug: route.slug,
        name: route.name,
        region: route.region,
        seasonLabel: route.seasonLabel,
        description: route.description,
      } satisfies ShowRoute,
      stops: routeStopsList,
    };
  });
}

export async function pgGetFeed() {
  const db = requirePostgres();
  const postRows = await db.select().from(posts).orderBy(desc(posts.createdAt)).limit(100);
  if (!postRows.length) return [];

  const userIds = [...new Set(postRows.map((p) => p.authorUserId))];
  const artistIds = [...new Set(postRows.map((p) => p.artistId).filter(Boolean))] as string[];
  const editionIds = [...new Set(postRows.map((p) => p.editionId).filter(Boolean))] as string[];

  const userRows = await db.select().from(users).where(inArray(users.id, userIds));
  const artistRows =
    artistIds.length > 0
      ? await db.select().from(artists).where(inArray(artists.id, artistIds))
      : [];
  const editionRows =
    editionIds.length > 0
      ? await db.select().from(editions).where(inArray(editions.id, editionIds))
      : [];
  const showIds = [...new Set(editionRows.map((e) => e.showId))];
  const showRows =
    showIds.length > 0 ? await db.select().from(shows).where(inArray(shows.id, showIds)) : [];

  return postRows.map((post) => {
    const author = userRows.find((u) => u.id === post.authorUserId)!;
    const artist = post.artistId ? artistRows.find((a) => a.id === post.artistId) : undefined;
    const edition = post.editionId ? editionRows.find((e) => e.id === post.editionId) : undefined;
    const show = edition ? showRows.find((s) => s.id === edition.showId) : undefined;
    return {
      post: {
        id: post.id,
        authorUserId: post.authorUserId,
        artistId: post.artistId ?? undefined,
        body: post.body,
        imageUrl: post.imageUrl ?? undefined,
        editionId: post.editionId ?? undefined,
        createdAt: post.createdAt.toISOString(),
      } satisfies Post,
      author: mapUser(author),
      artist: artist ? mapArtist(artist) : undefined,
      edition: edition ? mapEdition(edition) : undefined,
      show: show ? mapShow(show) : undefined,
    };
  });
}

export async function pgCreatePost(input: {
  authorUserId: string;
  body: string;
  artistId?: string;
  editionId?: string;
}) {
  const db = requirePostgres();
  const id = `post_${nanoid(8)}`;
  const now = new Date();
  await db.insert(posts).values({
    id,
    authorUserId: input.authorUserId,
    artistId: input.artistId ?? null,
    editionId: input.editionId ?? null,
    body: input.body.trim(),
    createdAt: now,
  });
  return {
    id,
    authorUserId: input.authorUserId,
    artistId: input.artistId,
    body: input.body,
    editionId: input.editionId,
    createdAt: now.toISOString(),
  } satisfies Post;
}

export async function pgGetPersonalCalendar(artistId: string) {
  const db = requirePostgres();
  const bookingRows = await db
    .select()
    .from(artistBookings)
    .where(eq(artistBookings.artistId, artistId));
  if (!bookingRows.length) return [];

  const editionIds = bookingRows.map((b) => b.editionId);
  const editionRows = await db.select().from(editions).where(inArray(editions.id, editionIds));
  const showIds = [...new Set(editionRows.map((e) => e.showId))];
  const showRows = await db.select().from(shows).where(inArray(shows.id, showIds));

  return bookingRows
    .map((booking) => {
      const edition = editionRows.find((e) => e.id === booking.editionId)!;
      const show = showRows.find((s) => s.id === edition.showId)!;
      return {
        booking: {
          id: booking.id,
          artistId: booking.artistId,
          editionId: booking.editionId,
          intent: booking.intent as ArtistShowBooking["intent"],
          createdAt: booking.createdAt.toISOString(),
        },
        edition: mapEdition(edition),
        show: mapShow(show),
      };
    })
    .sort((a, b) => a.edition.startDate.localeCompare(b.edition.startDate));
}

export async function pgGetWeekendMode(showSlug: string, showgoerUserId: string) {
  const { pgGetShowBySlug } = await import("./pg-repo");
  const detail = await pgGetShowBySlug(showSlug);
  if (!detail?.current) return null;

  const db = requirePostgres();
  const followRows = await db
    .select()
    .from(follows)
    .where(eq(follows.followerUserId, showgoerUserId));
  const followedIds = followRows.map((f) => f.artistId);

  const fav = await db
    .select()
    .from(favoriteShows)
    .where(
      and(eq(favoriteShows.userId, showgoerUserId), eq(favoriteShows.showId, detail.show.id)),
    )
    .limit(1)
    .then((r) => r[0]);

  const appsHere =
    followedIds.length > 0
      ? await db
          .select()
          .from(applications)
          .where(
            and(
              eq(applications.editionId, detail.current.id),
              inArray(applications.artistId, followedIds),
            ),
          )
      : [];

  const accepted = appsHere.filter((a) =>
    ["accepted", "waitlisted"].includes(a.status),
  );
  const artistRows =
    accepted.length > 0
      ? await db
          .select()
          .from(artists)
          .where(inArray(artists.id, accepted.map((a) => a.artistId)))
      : [];

  const boothRows = await db
    .select()
    .from(boothOffers)
    .where(eq(boothOffers.editionId, detail.current.id));

  return {
    ...detail,
    artistsYouFollow: artistRows.map(mapArtist),
    isFavorite: Boolean(fav),
    boothOffers: boothRows,
  };
}

export async function pgToggleFollowArtist(followerUserId: string, artistId: string) {
  const db = requirePostgres();
  const existing = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerUserId, followerUserId), eq(follows.artistId, artistId)))
    .limit(1)
    .then((r) => r[0]);
  if (existing) {
    await db.delete(follows).where(eq(follows.id, existing.id));
    return { following: false };
  }
  await db.insert(follows).values({
    id: `fol_${nanoid(8)}`,
    followerUserId,
    artistId,
  });
  return { following: true };
}

export async function pgIsFollowingArtist(followerUserId: string, artistId: string) {
  const db = requirePostgres();
  const row = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerUserId, followerUserId), eq(follows.artistId, artistId)))
    .limit(1)
    .then((r) => r[0]);
  return Boolean(row);
}

export async function pgToggleFavoriteShow(userId: string, showId: string) {
  const db = requirePostgres();
  const existing = await db
    .select()
    .from(favoriteShows)
    .where(and(eq(favoriteShows.userId, userId), eq(favoriteShows.showId, showId)))
    .limit(1)
    .then((r) => r[0]);
  if (existing) {
    await db.delete(favoriteShows).where(eq(favoriteShows.id, existing.id));
    return { favorited: false };
  }
  await db.insert(favoriteShows).values({
    id: `fav_${nanoid(8)}`,
    userId,
    showId,
  });
  return { favorited: true };
}

export async function pgFollowerCount(artistId: string) {
  const db = requirePostgres();
  const rows = await db.select().from(follows).where(eq(follows.artistId, artistId));
  return rows.length;
}

export async function pgListOrdersForBuyer(buyerUserId: string) {
  const db = requirePostgres();
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.buyerUserId, buyerUserId))
    .orderBy(desc(orders.createdAt));
  return enrichOrders(orderRows);
}

export async function pgListOrdersForArtist(artistId: string) {
  const db = requirePostgres();
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.artistId, artistId))
    .orderBy(desc(orders.createdAt));
  return enrichOrders(orderRows);
}

async function enrichOrders(orderRows: (typeof orders.$inferSelect)[]) {
  if (!orderRows.length) return [];
  const db = requirePostgres();
  const productIds = [...new Set(orderRows.map((o) => o.productId))];
  const productRows = await db.select().from(products).where(inArray(products.id, productIds));
  return orderRows.map((order) => ({
    order,
    product: productRows.find((p) => p.id === order.productId)!,
  }));
}

export async function pgUpdateOrderStatus(
  orderId: string,
  artistId: string,
  status: "shipped" | "cancelled",
) {
  const db = requirePostgres();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order || order.artistId !== artistId) throw new Error("Order not found");
  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export async function pgUpsertProduct(input: {
  artistId: string;
  productId?: string;
  title: string;
  description: string;
  priceCents: number;
  inventory: number;
  medium: string;
  active?: boolean;
}) {
  const db = requirePostgres();
  if (input.productId) {
    await db
      .update(products)
      .set({
        title: input.title,
        description: input.description,
        priceCents: input.priceCents,
        inventory: input.inventory,
        medium: input.medium,
        active: input.active ?? true,
      })
      .where(and(eq(products.id, input.productId), eq(products.artistId, input.artistId)));
    return input.productId;
  }
  const id = `prod_${nanoid(8)}`;
  await db.insert(products).values({
    id,
    artistId: input.artistId,
    title: input.title,
    description: input.description,
    priceCents: input.priceCents,
    inventory: input.inventory,
    medium: input.medium,
    active: true,
  });
  return id;
}

export async function pgUpsertSponsorshipTier(input: {
  artistId: string;
  tierId?: string;
  name: string;
  monthlyPriceCents: number;
  perks: string[];
  active?: boolean;
}) {
  const db = requirePostgres();
  if (input.tierId) {
    await db
      .update(sponsorshipTiers)
      .set({
        name: input.name,
        monthlyPriceCents: input.monthlyPriceCents,
        perks: input.perks,
        active: input.active ?? true,
      })
      .where(
        and(eq(sponsorshipTiers.id, input.tierId), eq(sponsorshipTiers.artistId, input.artistId)),
      );
    return input.tierId;
  }
  const id = `tier_${nanoid(8)}`;
  await db.insert(sponsorshipTiers).values({
    id,
    artistId: input.artistId,
    name: input.name,
    monthlyPriceCents: input.monthlyPriceCents,
    perks: input.perks,
    active: true,
  });
  return id;
}

export async function pgListPendingDirectors() {
  const db = requirePostgres();
  return db.select().from(directors).where(eq(directors.verified, false));
}

export async function pgVerifyDirector(directorId: string, adminUserId: string) {
  const db = requirePostgres();
  await db
    .update(directors)
    .set({ verified: true, verifiedAt: new Date() })
    .where(eq(directors.id, directorId));
  const { writeAudit } = await import("@/lib/audit");
  await writeAudit({
    actorUserId: adminUserId,
    action: "director.verify",
    entityType: "director",
    entityId: directorId,
  });
}

export async function pgListOperationalAlerts(editionIds: string[]) {
  if (!editionIds.length) return [];
  const db = requirePostgres();
  const rows = await db
    .select()
    .from(showAlerts)
    .where(inArray(showAlerts.editionId, editionIds))
    .orderBy(desc(showAlerts.createdAt));
  return rows.map(
    (a) =>
      ({
        id: a.id,
        editionId: a.editionId,
        kind: a.kind as ShowAlert["kind"],
        title: a.title,
        body: a.body,
        createdAt: a.createdAt.toISOString(),
      }) satisfies ShowAlert,
  );
}
