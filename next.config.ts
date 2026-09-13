import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // One 404 page for both root layouts (app/global-not-found.tsx).
    globalNotFound: true,
  },
  images: {
    // AVIF first, WebP fallback; next/image negotiates per browser.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1440],
    imageSizes: [56, 128, 200, 256, 340],
    remotePatterns: [
      // Seed placeholders. Real photos come from Supabase Storage / R2 later.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "http", hostname: "127.0.0.1", port: "54321" },
      // Supabase Storage in production (foto-kos bucket).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
