import { hash } from "bcryptjs";
import { buildSeed } from "../lib/store/seed";
import { requirePostgres } from "../lib/db/client";
import {
  users,
  artists,
  directors,
  shows,
  editions,
  applications,
  roiReports,
  products,
  sponsorshipTiers,
  promotions,
  orders,
} from "../lib/db/schema";

/**
 * Import demo seed into Postgres.
 * Usage: DATABASE_URL=... pnpm --filter showshow db:seed
 */
async function main() {
  const db = requirePostgres();
  const seed = await buildSeed();
  const passwordHash = await hash("showshow", 10);

  console.log("Seeding users…");
  for (const u of seed.users) {
    await db
      .insert(users)
      .values({
        id: u.id,
        name: u.name,
        email: u.email.toLowerCase(),
        passwordHash,
        roles: u.roles,
        homeLat: u.homeBase ? String(u.homeBase.lat) : null,
        homeLng: u.homeBase ? String(u.homeBase.lng) : null,
        homeLabel: u.homeBase?.label ?? null,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: u.name,
          email: u.email.toLowerCase(),
          roles: u.roles,
          passwordHash,
          updatedAt: new Date(),
        },
      });
  }

  console.log("Seeding shows…");
  for (const s of seed.shows) {
    await db
      .insert(shows)
      .values({
        id: s.id,
        slug: s.slug,
        name: s.name,
        officialWebsiteUrl: s.officialWebsiteUrl,
        primaryCity: s.primaryCity,
        primaryRegion: s.primaryRegion,
        country: s.country,
        lat: String(s.geo.lat),
        lng: String(s.geo.lng),
        promotedUntil: s.promotedUntil ? new Date(s.promotedUntil) : null,
      })
      .onConflictDoUpdate({
        target: shows.id,
        set: {
          name: s.name,
          officialWebsiteUrl: s.officialWebsiteUrl,
          primaryCity: s.primaryCity,
          primaryRegion: s.primaryRegion,
          lat: String(s.geo.lat),
          lng: String(s.geo.lng),
        },
      });
  }

  console.log("Seeding editions…");
  for (const e of seed.editions) {
    await db
      .insert(editions)
      .values({
        id: e.id,
        showId: e.showId,
        year: e.year,
        startDate: e.startDate,
        endDate: e.endDate,
        applicationDeadline: e.applicationDeadline,
        venueName: e.venueName,
        fullAddress: e.fullAddress,
        lat: String(e.geo.lat),
        lng: String(e.geo.lng),
        boothFeeMin: e.boothFeeMin ?? null,
        boothFeeMax: e.boothFeeMax ?? null,
        applicationFee: e.applicationFee ?? null,
        currency: e.currency,
        juryProcess: e.juryProcess,
        attendance: e.attendance ?? null,
        attendanceSourceUrl: e.attendanceSourceUrl ?? null,
        directorName: e.directorName ?? null,
        directorEmail: e.directorEmail ?? null,
        directorPhone: e.directorPhone ?? null,
        status: e.status,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding artists…");
  for (const a of seed.artists) {
    await db
      .insert(artists)
      .values({
        id: a.id,
        userId: a.userId,
        slug: a.slug,
        displayName: a.displayName,
        tagline: a.tagline,
        bio: a.bio,
        mediums: a.mediums,
        portfolioUrls: a.portfolioUrls,
        boothDefaultSize: a.boothDefaultSize,
        city: a.city,
        region: a.region,
        stripeConnectReady: a.stripeConnectReady,
      })
      .onConflictDoUpdate({
        target: artists.id,
        set: {
          displayName: a.displayName,
          tagline: a.tagline,
          bio: a.bio,
          stripeConnectReady: a.stripeConnectReady,
        },
      });
  }

  for (const d of seed.directors) {
    await db
      .insert(directors)
      .values({
        id: d.id,
        userId: d.userId,
        showIds: d.showIds,
        verified: d.verified,
        verifiedDomain: d.verifiedDomain,
        verifiedAt: d.verifiedAt ? new Date(d.verifiedAt) : null,
      })
      .onConflictDoNothing();
  }

  for (const a of seed.applications) {
    await db
      .insert(applications)
      .values({
        id: a.id,
        artistId: a.artistId,
        editionId: a.editionId,
        status: a.status,
        officialApplyUrl: a.officialApplyUrl,
        appliedAt: a.appliedAt ? new Date(a.appliedAt) : null,
        updatedAt: new Date(a.updatedAt),
        reminderAt: a.reminderAt ? new Date(a.reminderAt) : null,
        notes: a.notes,
      })
      .onConflictDoNothing();
  }

  for (const r of seed.roiReports) {
    await db
      .insert(roiReports)
      .values({
        id: r.id,
        artistId: r.artistId,
        editionId: r.editionId,
        boothFee: r.boothFee,
        travel: r.travel,
        lodging: r.lodging,
        otherExpenses: r.otherExpenses,
        grossSales: r.grossSales,
        currency: r.currency,
        hoursWorked: r.hoursWorked,
        notes: r.notes,
        optInAggregate: r.optInAggregate,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      })
      .onConflictDoNothing();
  }

  for (const p of seed.products) {
    await db
      .insert(products)
      .values({
        id: p.id,
        artistId: p.artistId,
        title: p.title,
        description: p.description,
        priceCents: p.priceCents,
        inventory: p.inventory,
        imageUrl: p.imageUrl,
        medium: p.medium,
        active: p.active,
      })
      .onConflictDoNothing();
  }

  for (const t of seed.sponsorshipTiers) {
    await db
      .insert(sponsorshipTiers)
      .values({
        id: t.id,
        artistId: t.artistId,
        name: t.name,
        monthlyPriceCents: t.monthlyPriceCents,
        perks: t.perks,
        active: t.active,
      })
      .onConflictDoNothing();
  }

  for (const p of seed.promotions) {
    await db
      .insert(promotions)
      .values({
        id: p.id,
        showId: p.showId,
        directorUserId: p.directorUserId,
        startsAt: new Date(p.startsAt),
        endsAt: new Date(p.endsAt),
        budgetCents: p.budgetCents,
        status: p.status,
      })
      .onConflictDoNothing();
  }

  for (const o of seed.orders) {
    await db
      .insert(orders)
      .values({
        id: o.id,
        productId: o.productId,
        buyerUserId: o.buyerUserId,
        artistId: seed.products.find((p) => p.id === o.productId)?.artistId ?? seed.artists[0]!.id,
        quantity: o.quantity,
        totalCents: o.totalCents,
        status: o.status === "cancelled" ? "cancelled" : o.status,
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  }

  const showCount = await db.select({ id: shows.id }).from(shows);
  console.log(`Done. Shows in Postgres: ${showCount.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
