CREATE TABLE "artist_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"edition_id" text NOT NULL,
	"intent" text DEFAULT 'booked' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fact_provenance" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"field" text NOT NULL,
	"source_url" text NOT NULL,
	"source_kind" text DEFAULT 'official_site' NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"adapter_id" text DEFAULT 'manual' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorite_shows" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"show_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" text PRIMARY KEY NOT NULL,
	"follower_user_id" text NOT NULL,
	"artist_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"author_user_id" text NOT NULL,
	"artist_id" text,
	"edition_id" text,
	"body" text NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roi_breakdowns" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"medium" text NOT NULL,
	"sales" integer NOT NULL,
	"units_sold" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_stops" (
	"id" text PRIMARY KEY NOT NULL,
	"route_id" text NOT NULL,
	"edition_id" text NOT NULL,
	"order" integer NOT NULL,
	"travel_miles_from_prev" integer,
	"travel_hours_from_prev" integer
);
--> statement-breakpoint
CREATE TABLE "show_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"edition_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "show_external_refs" (
	"id" text PRIMARY KEY NOT NULL,
	"show_id" text NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"kind" text DEFAULT 'other' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "show_routes" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"season_label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "show_social_links" (
	"id" text PRIMARY KEY NOT NULL,
	"edition_id" text NOT NULL,
	"platform" text NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artist_bookings" ADD CONSTRAINT "artist_bookings_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_bookings" ADD CONSTRAINT "artist_bookings_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_shows" ADD CONSTRAINT "favorite_shows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_shows" ADD CONSTRAINT "favorite_shows_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_user_id_users_id_fk" FOREIGN KEY ("follower_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roi_breakdowns" ADD CONSTRAINT "roi_breakdowns_report_id_roi_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."roi_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_show_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."show_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_alerts" ADD CONSTRAINT "show_alerts_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_external_refs" ADD CONSTRAINT "show_external_refs_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_social_links" ADD CONSTRAINT "show_social_links_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_artist_idx" ON "artist_bookings" USING btree ("artist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favorite_shows_uidx" ON "favorite_shows" USING btree ("user_id","show_id");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_uidx" ON "follows" USING btree ("follower_user_id","artist_id");--> statement-breakpoint
CREATE INDEX "posts_created_idx" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "show_alerts_edition_idx" ON "show_alerts" USING btree ("edition_id");--> statement-breakpoint
CREATE UNIQUE INDEX "routes_slug_uidx" ON "show_routes" USING btree ("slug");