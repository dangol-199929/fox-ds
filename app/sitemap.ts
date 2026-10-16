import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/shopify/products";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const url = (path: string) => new URL(path, base).toString();

  const products = await getProducts({ first: 100 }).catch(() => []);

  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/shop"), changeFrequency: "weekly", priority: 0.8 },
    ...products.map((p) => ({
      url: url(`/products/${p.handle}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...["/shipping", "/refunds", "/privacy", "/terms", "/contact"].map((path) => ({
      url: url(path),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
