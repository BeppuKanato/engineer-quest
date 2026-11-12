import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.ENGINEER_QUEST_NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/photo-*",
      },
    ],
  },
};

export default nextConfig;
