import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShowShow",
    short_name: "ShowShow",
    description: "Art fair directory, applications, and ROI for exhibiting artists.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a2e28",
    theme_color: "#c45c3e",
    icons: [
      {
        src: "/icon",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
