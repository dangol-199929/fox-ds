import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { shopifyFetch } from "./client";
import { SHOP_POLICIES_QUERY } from "./queries";

export const SHOP_TAG = "shopify:shop";

export type ShopPolicy = { title: string; body: string; handle: string };

export type PolicyKind = "privacyPolicy" | "refundPolicy" | "shippingPolicy" | "termsOfService";

type ShopPoliciesResponse = {
  shop: { name: string } & Record<PolicyKind, ShopPolicy | null>;
};

/**
 * Store policies as written in Shopify (Settings → Policies). Shopify is the
 * source of truth so the site never shows terms the store hasn't published.
 * Returns null when a policy hasn't been written yet.
 */
export async function getShopPolicy(kind: PolicyKind): Promise<ShopPolicy | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(SHOP_TAG);

  const data = await shopifyFetch<ShopPoliciesResponse>({
    query: SHOP_POLICIES_QUERY,
    retry: true,
  });
  return data.shop[kind] ?? null;
}
