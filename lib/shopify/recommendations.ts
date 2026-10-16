import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { shopifyFetch } from "./client";
import { getCollectionProducts, isValidHandle, PRODUCTS_TAG } from "./products";
import { PRODUCT_RECOMMENDATIONS_QUERY, STORE_COUNTRY } from "./queries";
import { type RawProduct, reshapeProduct } from "./reshape";
import type { Product } from "./types";

/**
 * Recommendations for a product page, in priority order:
 *   1. Shopify's complementary products (set up in the Search & Discovery app)
 *   2. Shopify's related products (Shopify's own algorithm)
 *   3. The featured collection, as a fallback
 * The current product, duplicates and unavailable products are removed.
 * Nothing here tracks or profiles visitors.
 */
export async function getRecommendedProducts(
  handle: string,
  { fallbackCollection, limit = 4 }: { fallbackCollection: string; limit?: number },
): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_TAG);

  if (!isValidHandle(handle)) return [];

  const fetchIntent = async (intent: "COMPLEMENTARY" | "RELATED") => {
    try {
      const data = await shopifyFetch<{ productRecommendations: RawProduct[] | null }>({
        query: PRODUCT_RECOMMENDATIONS_QUERY,
        variables: { handle, intent, country: STORE_COUNTRY },
        retry: true,
      });
      return (data.productRecommendations ?? []).map(reshapeProduct);
    } catch {
      // A failed recommendation request should never break the product page.
      return [];
    }
  };

  const [complementary, related] = await Promise.all([
    fetchIntent("COMPLEMENTARY"),
    fetchIntent("RELATED"),
  ]);

  let candidates = [...complementary, ...related];
  if (candidates.length < limit) {
    const featured = await getCollectionProducts(fallbackCollection, 12).catch(() => null);
    candidates = [...candidates, ...(featured?.products ?? [])];
  }

  return pickRecommendations(candidates, handle, limit);
}

/** Dedupe, drop the current product and anything that can't be bought. */
export function pickRecommendations(candidates: Product[], currentHandle: string, limit: number): Product[] {
  const seen = new Set<string>([currentHandle]);
  const picked: Product[] = [];
  for (const product of candidates) {
    if (seen.has(product.handle) || !product.availableForSale) continue;
    seen.add(product.handle);
    picked.push(product);
    if (picked.length === limit) break;
  }
  return picked;
}
