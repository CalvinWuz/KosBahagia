import type { MetadataRoute } from "next";

const SITUS = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kosbahagia.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/kitchensink", "/disimpan", "/banding"] }],
    sitemap: `${SITUS}/sitemap.xml`,
  };
}
