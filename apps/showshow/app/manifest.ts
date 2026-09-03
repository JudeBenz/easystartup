import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShowShow",
    short_name: "ShowShow",
    description: "Art fair directory, applications, and ROI for exhibiting artists.",
    start_url: "/",
    display: "standalone",
    theme_color: "#1e3d32",
    background_color: "#fffdf8",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
