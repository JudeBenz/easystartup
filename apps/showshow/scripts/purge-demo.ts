import { inArray, or } from "drizzle-orm";
import { requirePostgres } from "../lib/db/client";
import {
  users,
  showAggregates,
  showAlerts,
  showRoutes,
  waitlistBooths,
  promotions,
  roiReports,
  patronageSubscriptions,
  announcements,
  orders,
} from "../lib/db/schema";

const DEMO_USER_IDS = ["user_aria", "user_sam", "user_jordan", "user_lee", "user_admin"];

const DEMO_EMAILS = [
  "aria@studio.example",
  "sam@clay.example",
  "jordan@cherryarts.org",
  "lee@mail.example",
  "ops@showshow.example",
];

const DEMO_ROUTE_IDS = ["route_midwest", "route_mountain", "route_florida"];

/**
 * Remove invented demo people, posts, ROI, alerts, and canned routes.
 * Keeps official-site show/edition facts.
 *
 *   pnpm --filter showshow db:purge-demo
 */
async function main() {
  const db = requirePostgres();

  const agg = await db.delete(showAggregates).returning({ id: showAggregates.id });
  const alerts = await db.delete(showAlerts).returning({ id: showAlerts.id });
  const wait = await db.delete(waitlistBooths).returning({ id: waitlistBooths.id });
  const promo = await db.delete(promotions).returning({ id: promotions.id });
  const roi = await db.delete(roiReports).returning({ id: roiReports.id });
  const subs = await db.delete(patronageSubscriptions).returning({ id: patronageSubscriptions.id });
  const anns = await db.delete(announcements).returning({ id: announcements.id });
  const ords = await db.delete(orders).returning({ id: orders.id });
  const routes = await db
    .delete(showRoutes)
    .where(inArray(showRoutes.id, DEMO_ROUTE_IDS))
    .returning({ id: showRoutes.id });

  const removedUsers = await db
    .delete(users)
    .where(or(inArray(users.id, DEMO_USER_IDS), inArray(users.email, DEMO_EMAILS)))
    .returning({ id: users.id, email: users.email });

  console.log("Purged demo rows:");
  console.log(`  users: ${removedUsers.length}`, removedUsers.map((u) => u.email).join(", ") || "(none)");
  console.log(`  aggregates: ${agg.length}`);
  console.log(`  alerts: ${alerts.length}`);
  console.log(`  waitlist: ${wait.length}`);
  console.log(`  promotions: ${promo.length}`);
  console.log(`  roi reports: ${roi.length}`);
  console.log(`  subscriptions: ${subs.length}`);
  console.log(`  announcements: ${anns.length}`);
  console.log(`  orders: ${ords.length}`);
  console.log(`  canned routes: ${routes.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
