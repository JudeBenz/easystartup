import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Production schema — money + identity first-class. */

export const userRoleEnum = pgEnum("user_role", [
  "artist",
  "showgoer",
  "director",
  "admin",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "interested",
  "applied",
  "juried",
  "accepted",
  "waitlisted",
  "declined",
  "withdrawn",
]);

export const juryProcessEnum = pgEnum("jury_process", [
  "blind",
  "panel",
  "invitation",
  "open",
  "unknown",
]);

export const editionStatusEnum = pgEnum("edition_status", [
  "upcoming",
  "active",
  "completed",
  "cancelled",
]);

export const ledgerKindEnum = pgEnum("ledger_kind", [
  "store_sale",
  "sponsorship",
  "promotion",
  "platform_fee",
  "refund",
  "payout",
  "adjustment",
]);

export const ledgerStatusEnum = pgEnum("ledger_status", [
  "pending",
  "requires_action",
  "succeeded",
  "failed",
  "refunded",
  "cancelled",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "shipped",
  "cancelled",
  "refunded",
]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    image: text("image"),
    passwordHash: text("password_hash"),
    roles: jsonb("roles").$type<Array<"artist" | "showgoer" | "director" | "admin">>().notNull(),
    homeLat: text("home_lat"),
    homeLng: text("home_lng"),
    homeLabel: text("home_label"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_uidx").on(t.email)],
);

/** Auth.js tables */
export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [uniqueIndex("accounts_provider_uidx").on(t.provider, t.providerAccountId)],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("verification_token_uidx").on(t.identifier, t.token)],
);

export const artists = pgTable(
  "artists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    tagline: text("tagline").notNull().default(""),
    bio: text("bio").notNull().default(""),
    mediums: jsonb("mediums").$type<string[]>().notNull().default([]),
    portfolioUrls: jsonb("portfolio_urls").$type<string[]>().notNull().default([]),
    boothDefaultSize: text("booth_default_size"),
    city: text("city").notNull(),
    region: text("region").notNull(),
    stripeConnectAccountId: text("stripe_connect_account_id"),
    stripeConnectReady: boolean("stripe_connect_ready").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("artists_slug_uidx").on(t.slug),
    uniqueIndex("artists_user_uidx").on(t.userId),
  ],
);

export const directors = pgTable("directors", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  showIds: jsonb("show_ids").$type<string[]>().notNull().default([]),
  verified: boolean("verified").notNull().default(false),
  verifiedDomain: text("verified_domain"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  stripeConnectAccountId: text("stripe_connect_account_id"),
});

export const shows = pgTable(
  "shows",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    officialWebsiteUrl: text("official_website_url").notNull(),
    primaryCity: text("primary_city").notNull(),
    primaryRegion: text("primary_region").notNull(),
    country: text("country").notNull().default("US"),
    lat: text("lat").notNull(),
    lng: text("lng").notNull(),
    promotedUntil: timestamp("promoted_until", { withTimezone: true }),
  },
  (t) => [uniqueIndex("shows_slug_uidx").on(t.slug)],
);

export const editions = pgTable(
  "editions",
  {
    id: text("id").primaryKey(),
    showId: text("show_id")
      .notNull()
      .references(() => shows.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    applicationDeadline: text("application_deadline"),
    venueName: text("venue_name").notNull(),
    fullAddress: text("full_address").notNull(),
    lat: text("lat").notNull(),
    lng: text("lng").notNull(),
    boothFeeMin: integer("booth_fee_min"),
    boothFeeMax: integer("booth_fee_max"),
    applicationFee: integer("application_fee"),
    currency: text("currency").notNull().default("USD"),
    juryProcess: juryProcessEnum("jury_process").notNull().default("unknown"),
    attendance: integer("attendance"),
    attendanceSourceUrl: text("attendance_source_url"),
    directorName: text("director_name"),
    directorEmail: text("director_email"),
    directorPhone: text("director_phone"),
    status: editionStatusEnum("status").notNull().default("upcoming"),
  },
  (t) => [
    index("editions_show_idx").on(t.showId),
    uniqueIndex("editions_show_year_uidx").on(t.showId, t.year),
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: text("id").primaryKey(),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    editionId: text("edition_id")
      .notNull()
      .references(() => editions.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").notNull(),
    officialApplyUrl: text("official_apply_url").notNull(),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    reminderAt: timestamp("reminder_at", { withTimezone: true }),
    notes: text("notes"),
  },
  (t) => [
    uniqueIndex("applications_artist_edition_uidx").on(t.artistId, t.editionId),
    index("applications_deadline_idx").on(t.reminderAt),
  ],
);

export const roiReports = pgTable(
  "roi_reports",
  {
    id: text("id").primaryKey(),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    editionId: text("edition_id")
      .notNull()
      .references(() => editions.id, { onDelete: "cascade" }),
    boothFee: integer("booth_fee").notNull(),
    travel: integer("travel").notNull(),
    lodging: integer("lodging").notNull(),
    otherExpenses: integer("other_expenses").notNull(),
    grossSales: integer("gross_sales").notNull(),
    currency: text("currency").notNull().default("USD"),
    hoursWorked: integer("hours_worked"),
    notes: text("notes"),
    optInAggregate: boolean("opt_in_aggregate").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("roi_artist_idx").on(t.artistId)],
);

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  artistId: text("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull(),
  inventory: integer("inventory").notNull().default(0),
  imageUrl: text("image_url"),
  medium: text("medium").notNull(),
  active: boolean("active").notNull().default(true),
});

export const sponsorshipTiers = pgTable("sponsorship_tiers", {
  id: text("id").primaryKey(),
  artistId: text("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  monthlyPriceCents: integer("monthly_price_cents").notNull(),
  perks: jsonb("perks").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  stripePriceId: text("stripe_price_id"),
});

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    buyerUserId: text("buyer_user_id")
      .notNull()
      .references(() => users.id),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id),
    quantity: integer("quantity").notNull(),
    totalCents: integer("total_cents").notNull(),
    platformFeeCents: integer("platform_fee_cents").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    status: orderStatusEnum("status").notNull().default("pending"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_buyer_idx").on(t.buyerUserId)],
);

export const promotions = pgTable("promotions", {
  id: text("id").primaryKey(),
  showId: text("show_id")
    .notNull()
    .references(() => shows.id),
  directorUserId: text("director_user_id")
    .notNull()
    .references(() => users.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  budgetCents: integer("budget_cents").notNull(),
  status: text("status").notNull().default("pending"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
});

/**
 * Append-only money journal. UI never “marks paid” without a matching row
 * whose status was set by a verified Stripe webhook (or admin adjustment).
 */
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: text("id").primaryKey(),
    kind: ledgerKindEnum("kind").notNull(),
    status: ledgerStatusEnum("status").notNull().default("pending"),
    amountCents: integer("amount_cents").notNull(),
    platformFeeCents: integer("platform_fee_cents").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    payerUserId: text("payer_user_id").references(() => users.id),
    payeeArtistId: text("payee_artist_id").references(() => artists.id),
    payeeUserId: text("payee_user_id").references(() => users.id),
    orderId: text("order_id").references(() => orders.id),
    promotionId: text("promotion_id").references(() => promotions.id),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeChargeId: text("stripe_charge_id"),
    stripeTransferId: text("stripe_transfer_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("ledger_idempotency_uidx").on(t.idempotencyKey),
    index("ledger_pi_idx").on(t.stripePaymentIntentId),
  ],
);

/** Idempotent Stripe webhook intake. */
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(), // evt_...
  type: text("type").notNull(),
  livemode: boolean("livemode").notNull().default(false),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  error: text("error"),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_entity_idx").on(t.entityType, t.entityId)],
);

/** Social / ops tables — same product surface as the demo store. */
export const showComments = pgTable(
  "show_comments",
  {
    id: text("id").primaryKey(),
    editionId: text("edition_id")
      .notNull()
      .references(() => editions.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("comments_edition_idx").on(t.editionId)],
);

export const announcements = pgTable(
  "announcements",
  {
    id: text("id").primaryKey(),
    editionId: text("edition_id")
      .notNull()
      .references(() => editions.id, { onDelete: "cascade" }),
    directorUserId: text("director_user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    body: text("body").notNull(),
    kind: text("kind").notNull().default("general"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("announcements_edition_idx").on(t.editionId)],
);

export const waitlistBooths = pgTable("waitlist_booths", {
  id: text("id").primaryKey(),
  editionId: text("edition_id")
    .notNull()
    .references(() => editions.id, { onDelete: "cascade" }),
  boothLabel: text("booth_label"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const juryFeedback = pgTable("jury_feedback", {
  id: text("id").primaryKey(),
  artistId: text("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  editionId: text("edition_id")
    .notNull()
    .references(() => editions.id, { onDelete: "cascade" }),
  outcome: text("outcome").notNull(),
  notes: text("notes"),
  imageUrls: jsonb("image_urls").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const boothOffers = pgTable("booth_offers", {
  id: text("id").primaryKey(),
  artistId: text("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  editionId: text("edition_id")
    .notNull()
    .references(() => editions.id, { onDelete: "cascade" }),
  availableWindows: text("available_windows").notNull(),
  notes: text("notes"),
});

export const boothRequests = pgTable("booth_requests", {
  id: text("id").primaryKey(),
  artistId: text("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  editionId: text("edition_id")
    .notNull()
    .references(() => editions.id, { onDelete: "cascade" }),
  neededWindow: text("needed_window").notNull(),
  status: text("status").notNull().default("open"),
});

export const patronageSubscriptions = pgTable(
  "patronage_subscriptions",
  {
    id: text("id").primaryKey(),
    tierId: text("tier_id")
      .notNull()
      .references(() => sponsorshipTiers.id),
    patronUserId: text("patron_user_id")
      .notNull()
      .references(() => users.id),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id),
    status: text("status").notNull().default("pending"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("patronage_patron_idx").on(t.patronUserId)],
);

export const showAggregates = pgTable(
  "show_aggregates",
  {
    id: text("id").primaryKey(),
    editionId: text("edition_id")
      .notNull()
      .references(() => editions.id, { onDelete: "cascade" }),
    showId: text("show_id")
      .notNull()
      .references(() => shows.id, { onDelete: "cascade" }),
    sampleSize: integer("sample_size").notNull(),
    medianNet: integer("median_net"),
    medianGrossSales: integer("median_gross_sales"),
    medianTotalExpenses: integer("median_total_expenses"),
    topMediums: jsonb("top_mediums")
      .$type<{ medium: string; share: number }[]>()
      .notNull()
      .default([]),
    label: text("label").notNull().default("self_reported"),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
    minNMet: boolean("min_n_met").notNull().default(false),
  },
  (t) => [index("aggregates_show_idx").on(t.showId)],
);

/** Idempotent deadline email sends. */
export const emailDeliveries = pgTable(
  "email_deliveries",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    toEmail: text("to_email").notNull(),
    entityId: text("entity_id").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    providerId: text("provider_id"),
  },
  (t) => [uniqueIndex("email_delivery_uidx").on(t.kind, t.entityId, t.toEmail)],
);

/** Social graph + content */
export const follows = pgTable(
  "follows",
  {
    id: text("id").primaryKey(),
    followerUserId: text("follower_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("follows_uidx").on(t.followerUserId, t.artistId)],
);

export const favoriteShows = pgTable(
  "favorite_shows",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    showId: text("show_id")
      .notNull()
      .references(() => shows.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("favorite_shows_uidx").on(t.userId, t.showId)],
);

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    artistId: text("artist_id").references(() => artists.id, { onDelete: "set null" }),
    editionId: text("edition_id").references(() => editions.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("posts_created_idx").on(t.createdAt)],
);

export const artistBookings = pgTable(
  "artist_bookings",
  {
    id: text("id").primaryKey(),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    editionId: text("edition_id")
      .notNull()
      .references(() => editions.id, { onDelete: "cascade" }),
    intent: text("intent").notNull().default("booked"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("bookings_artist_idx").on(t.artistId)],
);

export const showRoutes = pgTable(
  "show_routes",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    region: text("region").notNull(),
    seasonLabel: text("season_label").notNull(),
    description: text("description").notNull().default(""),
  },
  (t) => [uniqueIndex("routes_slug_uidx").on(t.slug)],
);

export const routeStops = pgTable("route_stops", {
  id: text("id").primaryKey(),
  routeId: text("route_id")
    .notNull()
    .references(() => showRoutes.id, { onDelete: "cascade" }),
  editionId: text("edition_id")
    .notNull()
    .references(() => editions.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  travelMilesFromPrev: integer("travel_miles_from_prev"),
  travelHoursFromPrev: integer("travel_hours_from_prev"),
});

export const showAlerts = pgTable(
  "show_alerts",
  {
    id: text("id").primaryKey(),
    editionId: text("edition_id")
      .notNull()
      .references(() => editions.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("show_alerts_edition_idx").on(t.editionId)],
);

export const roiBreakdowns = pgTable("roi_breakdowns", {
  id: text("id").primaryKey(),
  reportId: text("report_id")
    .notNull()
    .references(() => roiReports.id, { onDelete: "cascade" }),
  medium: text("medium").notNull(),
  sales: integer("sales").notNull(),
  unitsSold: integer("units_sold").notNull().default(0),
});

export const showSocialLinks = pgTable("show_social_links", {
  id: text("id").primaryKey(),
  editionId: text("edition_id")
    .notNull()
    .references(() => editions.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
});

export const showExternalRefs = pgTable("show_external_refs", {
  id: text("id").primaryKey(),
  showId: text("show_id")
    .notNull()
    .references(() => shows.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  kind: text("kind").notNull().default("other"),
});

export const factProvenance = pgTable("fact_provenance", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  field: text("field").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceKind: text("source_kind").notNull().default("official_site"),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  adapterId: text("adapter_id").notNull().default("manual"),
});
