import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { shopifyFetch } from "./client";
import {
  COLLECTION_PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCTS_QUERY,
  STORE_COUNTRY,
} from "./queries";
import { type RawProduct, reshapeProduct } from "./reshape";
import type { Product } from "./types";

/** Cache tags, revalidated by the Shopify product webhook (later phase). */
export const PRODUCTS_TAG = "shopify:products";
export const productTag = (handle: string) => `shopify:product:${handle}`;
export const COLLECTIONS_TAG = "shopify:collections";

// Shopify handles are lowercase letters, digits and hyphens.
const HANDLE = /^[a-z0-9][a-z0-9-]{0,254}$/;

export function isValidHandle(handle: string): boolean {
  return HANDLE.test(handle);
}

export const PRODUCT_SORT_KEYS = [
  "RELEVANCE",
  "BEST_SELLING",
  "CREATED_AT",
  "PRICE",
  "TITLE",
  "UPDATED_AT",
] as const;
export type ProductSortKey = (typeof PRODUCT_SORT_KEYS)[number];

/** Public product data, shared by all visitors and safe to cache. */
export async function getProduct(handle: string): Promise<Product | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_TAG, productTag(handle));

  if (!isValidHandle(handle)) return null;

  const data = await shopifyFetch<{ product: RawProduct | null }>({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: { handle, country: STORE_COUNTRY },
    retry: true,
  });
  return data.product ? reshapeProduct(data.product) : null;
}

export async function getProducts({
  first = 24,
  sortKey = "BEST_SELLING",
  reverse = false,
}: {
  first?: number;
  sortKey?: ProductSortKey;
  reverse?: boolean;
} = {}): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_TAG);

  const data = await shopifyFetch<{ products: { nodes: RawProduct[] } }>({
    query: PRODUCTS_QUERY,
    variables: {
      first: Math.min(Math.max(Math.trunc(first), 1), 100),
      sortKey: PRODUCT_SORT_KEYS.includes(sortKey) ? sortKey : "BEST_SELLING",
      reverse,
      country: STORE_COUNTRY,
    },
    retry: true,
  });
  return data.products.nodes.map(reshapeProduct);
}

export type CollectionWithProducts = {
  handle: string;
  title: string;
  description: string;
  products: Product[];
};

export async function getCollectionProducts(
  handle: string,
  first = 24,
): Promise<CollectionWithProducts | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_TAG, COLLECTIONS_TAG);

  if (!isValidHandle(handle)) return null;

  const data = await shopifyFetch<{
    collection: {
      handle: string;
      title: string;
      description: string;
      products: { nodes: RawProduct[] };
    } | null;
  }>({
    query: COLLECTION_PRODUCTS_QUERY,
    variables: {
      handle,
      first: Math.min(Math.max(Math.trunc(first), 1), 100),
      country: STORE_COUNTRY,
    },
    retry: true,
  });

  if (!data.collection) return null;
  return {
    ...data.collection,
    products: data.collection.products.nodes.map(reshapeProduct),
  };
}
