CREATE TYPE "public"."application_status" AS ENUM('interested', 'applied', 'juried', 'accepted', 'waitlisted', 'declined', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."edition_status" AS ENUM('upcoming', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."jury_process" AS ENUM('blind', 'panel', 'invitation', 'open', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."ledger_kind" AS ENUM('store_sale', 'sponsorship', 'promotion', 'platform_fee', 'refund', 'payout', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."ledger_status" AS ENUM('pending', 'requires_action', 'succeeded', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'shipped', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('artist', 'showgoer', 'director', 'admin');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"edition_id" text NOT NULL,
	"status" "application_status" NOT NULL,
	"official_apply_url" text NOT NULL,
	"applied_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reminder_at" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"mediums" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"portfolio_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"booth_default_size" text,
	"city" text NOT NULL,
	"region" text NOT NULL,
	"stripe_connect_account_id" text,
	"stripe_connect_ready" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "directors" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"show_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_domain" text,
	"verified_at" timestamp with time zone,
	"stripe_connect_account_id" text
);
--> statement-breakpoint
CREATE TABLE "editions" (
	"id" text PRIMARY KEY NOT NULL,
	"show_id" text NOT NULL,
	"year" integer NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"application_deadline" text,
	"venue_name" text NOT NULL,
	"full_address" text NOT NULL,
	"lat" text NOT NULL,
	"lng" text NOT NULL,
	"booth_fee_min" integer,
	"booth_fee_max" integer,
	"application_fee" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"jury_process" "jury_process" DEFAULT 'unknown' NOT NULL,
	"attendance" integer,
	"attendance_source_url" text,
	"director_name" text,
	"director_email" text,
	"director_phone" text,
	"status" "edition_status" DEFAULT 'upcoming' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "ledger_kind" NOT NULL,
	"status" "ledger_status" DEFAULT 'pending' NOT NULL,
	"amount_cents" integer NOT NULL,
	"platform_fee_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"payer_user_id" text,
	"payee_artist_id" text,
	"payee_user_id" text,
	"order_id" text,
	"promotion_id" text,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"stripe_charge_id" text,
	"stripe_transfer_id" text,
	"idempotency_key" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"buyer_user_id" text NOT NULL,
	"artist_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"platform_fee_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_cents" integer NOT NULL,
	"inventory" integer DEFAULT 0 NOT NULL,
	"image_url" text,
	"medium" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" text PRIMARY KEY NOT NULL,
	"show_id" text NOT NULL,
	"director_user_id" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"budget_cents" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text
);
--> statement-breakpoint
CREATE TABLE "roi_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"edition_id" text NOT NULL,
	"booth_fee" integer NOT NULL,
	"travel" integer NOT NULL,
	"lodging" integer NOT NULL,
	"other_expenses" integer NOT NULL,
	"gross_sales" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"hours_worked" integer,
	"notes" text,
	"opt_in_aggregate" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shows" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"official_website_url" text NOT NULL,
	"primary_city" text NOT NULL,
	"primary_region" text NOT NULL,
	"country" text DEFAULT 'US' NOT NULL,
	"lat" text NOT NULL,
	"lng" text NOT NULL,
	"promoted_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sponsorship_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"name" text NOT NULL,
	"monthly_price_cents" integer NOT NULL,
	"perks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"stripe_price_id" text
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"livemode" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp with time zone,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"password_hash" text,
	"roles" jsonb NOT NULL,
	"home_lat" text,
	"home_lng" text,
	"home_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directors" ADD CONSTRAINT "directors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editions" ADD CONSTRAINT "editions_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_payer_user_id_users_id_fk" FOREIGN KEY ("payer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_payee_artist_id_artists_id_fk" FOREIGN KEY ("payee_artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_payee_user_id_users_id_fk" FOREIGN KEY ("payee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_director_user_id_users_id_fk" FOREIGN KEY ("director_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roi_reports" ADD CONSTRAINT "roi_reports_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roi_reports" ADD CONSTRAINT "roi_reports_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_tiers" ADD CONSTRAINT "sponsorship_tiers_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_uidx" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_artist_edition_uidx" ON "applications" USING btree ("artist_id","edition_id");--> statement-breakpoint
CREATE INDEX "applications_deadline_idx" ON "applications" USING btree ("reminder_at");--> statement-breakpoint
CREATE UNIQUE INDEX "artists_slug_uidx" ON "artists" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "artists_user_uidx" ON "artists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "editions_show_idx" ON "editions" USING btree ("show_id");--> statement-breakpoint
CREATE UNIQUE INDEX "editions_show_year_uidx" ON "editions" USING btree ("show_id","year");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_idempotency_uidx" ON "ledger_entries" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "ledger_pi_idx" ON "ledger_entries" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "orders_buyer_idx" ON "orders" USING btree ("buyer_user_id");--> statement-breakpoint
CREATE INDEX "roi_artist_idx" ON "roi_reports" USING btree ("artist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shows_slug_uidx" ON "shows" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uidx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_token_uidx" ON "verification_tokens" USING btree ("identifier","token");