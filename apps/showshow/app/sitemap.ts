import type { MetadataRoute } from "next";
import { isPostgresEnabled } from "@/lib/db/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.AUTH_URL ?? "https://showshow.app";
  const staticRoutes = [
    "",
    "/shows",
    "/shows/map",
    "/shows/calendar",
    "/shows/ranked",
    "/artists",
    "/feed",
    "/routes",
    "/join",
    "/signin",
    "/install",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  if (!isPostgresEnabled()) return staticRoutes;

  try {
    const { listShows } = await import("@/lib/store");
    const shows = await listShows();
    const showUrls = shows.map((s) => ({
      url: `${base}/shows/${s.show.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    return [...staticRoutes, ...showUrls];
  } catch {
    // Empty or unmigrated database must not fail `next build` (Vercel).
    return staticRoutes;
  }
}
