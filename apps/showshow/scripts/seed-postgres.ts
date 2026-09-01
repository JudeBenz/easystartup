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
  roiBreakdowns,
  showAggregates,
  products,
  sponsorshipTiers,
  promotions,
  orders,
  showComments,
  announcements,
  waitlistBooths,
  boothOffers,
  boothRequests,
  juryFeedback,
  follows,
  posts,
  artistBookings,
  showRoutes,
  routeStops,
  showAlerts,
  showSocialLinks,
  showExternalRefs,
  factProvenance,
} from "../lib/db/schema";

/**
 * Import official-site show facts into Postgres.
 * Does not invent artists, posts, or ROI. Set SHOWSHOW_DEMO_PERSONAS=1 only for internal QA.
 */
async function main() {
  const db = requirePostgres();
  const seed = await buildSeed();
  const keepDemoPasswords = process.env.SHOWSHOW_DEMO_PERSONAS === "1";
  const passwordHash = keepDemoPasswords ? await hash("showshow", 10) : null;

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

  console.log("Seeding ROI breakdowns & aggregates…");
  for (const b of seed.roiBreakdowns) {
    await db
      .insert(roiBreakdowns)
      .values({
        id: b.id,
        reportId: b.reportId,
        medium: b.medium,
        sales: b.sales,
        unitsSold: b.unitsSold,
      })
      .onConflictDoNothing();
  }
  for (const a of seed.aggregates) {
    await db
      .insert(showAggregates)
      .values({
        id: a.id,
        editionId: a.editionId,
        showId: a.showId,
        sampleSize: a.sampleSize,
        medianNet: a.medianNet ?? null,
        medianGrossSales: a.medianGrossSales ?? null,
        medianTotalExpenses: a.medianTotalExpenses ?? null,
        topMediums: a.topMediums,
        label: a.label,
        computedAt: new Date(a.computedAt),
        minNMet: a.minNMet,
      })
      .onConflictDoUpdate({
        target: showAggregates.id,
        set: {
          sampleSize: a.sampleSize,
          medianNet: a.medianNet ?? null,
          medianGrossSales: a.medianGrossSales ?? null,
          medianTotalExpenses: a.medianTotalExpenses ?? null,
          topMediums: a.topMediums,
          minNMet: a.minNMet,
          computedAt: new Date(a.computedAt),
        },
      });
  }

  console.log("Seeding show community data…");
  for (const c of seed.comments) {
    await db
      .insert(showComments)
      .values({
        id: c.id,
        editionId: c.editionId,
        authorUserId: c.authorUserId,
        body: c.body,
        createdAt: new Date(c.createdAt),
      })
      .onConflictDoNothing();
  }
  for (const a of seed.announcements) {
    await db
      .insert(announcements)
      .values({
        id: a.id,
        editionId: a.editionId,
        directorUserId: a.directorUserId,
        title: a.title,
        body: a.body,
        kind: a.kind,
        createdAt: new Date(a.createdAt),
      })
      .onConflictDoNothing();
  }
  for (const w of seed.waitlist) {
    await db
      .insert(waitlistBooths)
      .values({
        id: w.id,
        editionId: w.editionId,
        boothLabel: w.boothLabel,
        status: w.status,
        createdAt: new Date(w.createdAt),
      })
      .onConflictDoNothing();
  }
  for (const o of seed.boothOffers) {
    await db
      .insert(boothOffers)
      .values({
        id: o.id,
        editionId: o.editionId,
        artistId: o.artistId,
        availableWindows: o.availableWindows,
        notes: o.notes ?? null,
      })
      .onConflictDoNothing();
  }
  for (const r of seed.boothRequests) {
    await db
      .insert(boothRequests)
      .values({
        id: r.id,
        editionId: r.editionId,
        artistId: r.artistId,
        neededWindow: r.neededWindow,
        status: r.status,
      })
      .onConflictDoNothing();
  }
  for (const j of seed.juryFeedback) {
    await db
      .insert(juryFeedback)
      .values({
        id: j.id,
        artistId: j.artistId,
        editionId: j.editionId,
        imageUrls: j.imageUrls,
        outcome: j.outcome,
        notes: j.notes ?? null,
        createdAt: new Date(j.createdAt),
      })
      .onConflictDoNothing();
  }

  console.log("Seeding social graph…");
  for (const f of seed.follows) {
    await db
      .insert(follows)
      .values({
        id: f.id,
        followerUserId: f.followerUserId,
        artistId: f.artistId,
        createdAt: new Date(f.createdAt),
      })
      .onConflictDoNothing();
  }
  for (const p of seed.posts) {
    await db
      .insert(posts)
      .values({
        id: p.id,
        authorUserId: p.authorUserId,
        artistId: p.artistId ?? null,
        editionId: p.editionId ?? null,
        body: p.body,
        imageUrl: p.imageUrl ?? null,
        createdAt: new Date(p.createdAt),
      })
      .onConflictDoNothing();
  }
  for (const b of seed.bookings) {
    await db
      .insert(artistBookings)
      .values({
        id: b.id,
        artistId: b.artistId,
        editionId: b.editionId,
        intent: b.intent,
        createdAt: new Date(b.createdAt),
      })
      .onConflictDoNothing();
  }
  for (const r of seed.routes) {
    await db
      .insert(showRoutes)
      .values({
        id: r.id,
        slug: r.slug,
        name: r.name,
        region: r.region,
        seasonLabel: r.seasonLabel,
        description: r.description,
      })
      .onConflictDoUpdate({
        target: showRoutes.id,
        set: {
          name: r.name,
          region: r.region,
          seasonLabel: r.seasonLabel,
          description: r.description,
        },
      });
  }
  for (const s of seed.routeStops) {
    await db
      .insert(routeStops)
      .values({
        id: s.id,
        routeId: s.routeId,
        editionId: s.editionId,
        order: s.order,
        travelMilesFromPrev: s.travelMilesFromPrev ?? null,
        travelHoursFromPrev:
          s.travelHoursFromPrev == null ? null : Math.round(s.travelHoursFromPrev),
      })
      .onConflictDoNothing();
  }
  for (const a of seed.alerts) {
    await db
      .insert(showAlerts)
      .values({
        id: a.id,
        editionId: a.editionId,
        kind: a.kind,
        title: a.title,
        body: a.body,
        createdAt: new Date(a.createdAt),
      })
      .onConflictDoNothing();
  }

  console.log("Seeding provenance & references…");
  for (const l of seed.socialLinks) {
    await db
      .insert(showSocialLinks)
      .values({
        id: l.id,
        editionId: l.editionId,
        platform: l.platform,
        url: l.url,
      })
      .onConflictDoNothing();
  }
  for (const r of seed.externalRefs) {
    await db
      .insert(showExternalRefs)
      .values({
        id: r.id,
        showId: r.showId,
        label: r.label,
        url: r.url,
        kind: r.kind,
      })
      .onConflictDoNothing();
  }
  for (const p of seed.provenance) {
    await db
      .insert(factProvenance)
      .values({
        id: p.id,
        entityType: p.entityType,
        entityId: p.entityId,
        field: p.field,
        sourceUrl: p.sourceUrl,
        sourceKind: p.sourceKind,
        capturedAt: new Date(p.capturedAt),
        adapterId: p.adapterId,
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
