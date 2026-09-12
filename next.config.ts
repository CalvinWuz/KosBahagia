import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Seed placeholders. Real photos come from Supabase Storage / R2 later.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "http", hostname: "127.0.0.1", port: "54321" },
    ],
  },
};

export default nextConfig;
