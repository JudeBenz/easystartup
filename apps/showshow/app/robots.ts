import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.AUTH_URL ?? "https://showshow.vercel.app";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/settings", "/admin/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
