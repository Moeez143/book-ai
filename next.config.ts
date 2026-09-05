import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "ia800507.us.archive.org" },
      { protocol: "https", hostname: "ia800404.us.archive.org" },
      { protocol: "https", hostname: "archive.org" },
      { protocol: "https", hostname: "y6skfcwgipz55yqj.public.blob.vercel-storage.com" },
    ],
    minimumCacheTTL: 3600, // cache images for 1 hour
  },
};

export default nextConfig;