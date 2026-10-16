import { parseSiteUrl } from "@/lib/env";

/**
 * Absolute site URL for canonical links, Open Graph and the sitemap.
 * Prefers NEXT_PUBLIC_SITE_URL, then Vercel's production URL, then localhost
 * for local builds, so a missing value never breaks the build.
 */
export function siteUrl(): URL {
  try {
    return parseSiteUrl({ NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL });
  } catch {
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    return new URL(vercel ? `https://${vercel}` : "http://localhost:3000");
  }
}
