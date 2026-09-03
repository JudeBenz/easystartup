import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aruba Solo Cup GP",
    short_name: "Solo Cup GP",
    description: "Family RC Grand Prix — leaderboard, drivers, Race Control",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#070d12",
    theme_color: "#070d12",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
