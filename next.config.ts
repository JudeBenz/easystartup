import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Deterministic seed avatars (SVG); used as <img>/next-image fallbacks.
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

export default nextConfig;
