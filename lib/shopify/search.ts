import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { shopifyFetch } from "./client";
import { PRODUCTS_TAG } from "./products";
import { SEARCH_PRODUCTS_QUERY, STORE_COUNTRY } from "./queries";
import { type RawProduct, reshapeProduct } from "./reshape";
import { type FilterGroup, SORT_OPTIONS, type SortValue } from "./search-options";
import type { Product } from "./types";

export type SearchResult = {
  products: Product[];
  totalCount: number;
  filters: FilterGroup[];
};

const PAGE_SIZE = 48;

/**
 * Catalogue search with Shopify's own filters (configured in the Search &
 * Discovery app) and sorting. Public data, so results are cached per
 * combination of inputs.
 */
export async function searchProducts({
  query = "",
  sort = "featured",
  productFilters = [],
}: {
  /** Free-text search; empty lists everything. */
  query?: string;
  sort?: SortValue;
  /** Parsed Shopify ProductFilter inputs; build them with parseShopParams. */
  productFilters?: Record<string, unknown>[];
} = {}): Promise<SearchResult> {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_TAG);

  const option = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];
  const data = await shopifyFetch<{
    search: {
      totalCount: number;
      productFilters: FilterGroup[];
      nodes: (RawProduct | Record<string, never>)[];
    };
  }>({
    query: SEARCH_PRODUCTS_QUERY,
    variables: {
      query: query.slice(0, 100),
      first: PAGE_SIZE,
      sortKey: option.sortKey,
      reverse: option.reverse,
      productFilters,
      country: STORE_COUNTRY,
    },
    retry: true,
  });

  return {
    totalCount: data.search.totalCount,
    filters: data.search.productFilters,
    products: data.search.nodes
      .filter((node): node is RawProduct => "handle" in node)
      .map(reshapeProduct),
  };
}
