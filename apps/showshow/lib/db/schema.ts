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
