CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"edition_id" text NOT NULL,
	"director_user_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"kind" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booth_offers" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"edition_id" text NOT NULL,
	"available_windows" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "booth_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"edition_id" text NOT NULL,
	"needed_window" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"to_email" text NOT NULL,
	"entity_id" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"provider_id" text
);
--> statement-breakpoint
CREATE TABLE "jury_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"edition_id" text NOT NULL,
	"outcome" text NOT NULL,
	"notes" text,
	"image_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patronage_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"tier_id" text NOT NULL,
	"patron_user_id" text NOT NULL,
	"artist_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_checkout_session_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "show_aggregates" (
	"id" text PRIMARY KEY NOT NULL,
	"edition_id" text NOT NULL,
	"show_id" text NOT NULL,
	"sample_size" integer NOT NULL,
	"median_net" integer,
	"median_gross_sales" integer,
	"median_total_expenses" integer,
	"top_mediums" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"label" text DEFAULT 'self_reported' NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"min_n_met" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "show_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"edition_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_booths" (
	"id" text PRIMARY KEY NOT NULL,
	"edition_id" text NOT NULL,
	"booth_label" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_director_user_id_users_id_fk" FOREIGN KEY ("director_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booth_offers" ADD CONSTRAINT "booth_offers_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booth_offers" ADD CONSTRAINT "booth_offers_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booth_requests" ADD CONSTRAINT "booth_requests_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booth_requests" ADD CONSTRAINT "booth_requests_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jury_feedback" ADD CONSTRAINT "jury_feedback_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jury_feedback" ADD CONSTRAINT "jury_feedback_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patronage_subscriptions" ADD CONSTRAINT "patronage_subscriptions_tier_id_sponsorship_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."sponsorship_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patronage_subscriptions" ADD CONSTRAINT "patronage_subscriptions_patron_user_id_users_id_fk" FOREIGN KEY ("patron_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patronage_subscriptions" ADD CONSTRAINT "patronage_subscriptions_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_aggregates" ADD CONSTRAINT "show_aggregates_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_aggregates" ADD CONSTRAINT "show_aggregates_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_comments" ADD CONSTRAINT "show_comments_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_comments" ADD CONSTRAINT "show_comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_booths" ADD CONSTRAINT "waitlist_booths_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_edition_idx" ON "announcements" USING btree ("edition_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_delivery_uidx" ON "email_deliveries" USING btree ("kind","entity_id","to_email");--> statement-breakpoint
CREATE INDEX "patronage_patron_idx" ON "patronage_subscriptions" USING btree ("patron_user_id");--> statement-breakpoint
CREATE INDEX "aggregates_show_idx" ON "show_aggregates" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX "comments_edition_idx" ON "show_comments" USING btree ("edition_id");