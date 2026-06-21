import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EasyStartUp",
    short_name: "EasyStartUp",
    description: "Field operations for growing teams",
    start_url: "/home",
    display: "standalone",
    background_color: "#F1F4F0",
    theme_color: "#0C5A39",
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
