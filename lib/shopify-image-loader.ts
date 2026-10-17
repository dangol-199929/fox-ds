"use client";

/**
 * next/image loader that asks Shopify's CDN for the right size instead of
 * routing every photo through Vercel's optimiser. Shopify resizes and serves
 * WebP/AVIF itself, which is faster on first view and doesn't count against
 * Vercel's image optimisation quota. Other URLs are returned unchanged.
 */
export default function shopifyImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src.startsWith("https://cdn.shopify.com/")) return src;
  const url = new URL(src);
  url.searchParams.set("width", String(width));
  if (quality) url.searchParams.set("quality", String(quality));
  return url.toString();
}
