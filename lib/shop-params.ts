import { z } from "zod";
import { categoryBySlug } from "@/lib/site";
import { SORT_OPTIONS, type FilterGroup, type SortValue } from "@/lib/shopify/search-options";

/**
 * Shop URL state, e.g.
 *   /shop?q=stand&category=desk-mats&sort=price-asc&filter=filter.v.availability.1&min=10&max=40
 *
 * Categories are our own slugs (lib/site.ts) mapped to Shopify product types;
 * unknown slugs are ignored. The search query is trimmed and length-limited.
 * Filter values are referenced by Shopify's own value ids and translated back
 * to Shopify's filter input on the server, so a visitor can't inject arbitrary
 * filter JSON through the URL. Unknown ids and malformed numbers are dropped.
 */

export type ShopParams = {
  q: string | null;
  category: string | null;
  sort: SortValue;
  filterIds: string[];
  minPrice: number | null;
  maxPrice: number | null;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

const FILTER_ID = /^filter\.[a-z]\.[A-Za-z0-9._-]{1,200}$/;
const MAX_QUERY_LENGTH = 100;
const price = z.coerce.number().finite().min(0).max(100_000);

function list(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseShopParams(params: RawSearchParams): ShopParams {
  const sortRaw = list(params.sort)[0];
  const sort = SORT_OPTIONS.some((o) => o.value === sortRaw) ? (sortRaw as SortValue) : "featured";

  const filterIds = [...new Set(list(params.filter).filter((id) => FILTER_ID.test(id)))].slice(0, 20);

  const min = price.safeParse(list(params.min)[0]);
  const max = price.safeParse(list(params.max)[0]);
  let minPrice = list(params.min)[0] && min.success ? min.data : null;
  let maxPrice = list(params.max)[0] && max.success ? max.data : null;
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const qRaw = (list(params.q)[0] ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
  const q = qRaw || null;
  const category = categoryBySlug(list(params.category)[0])?.slug ?? null;

  return { q, category, sort, filterIds, minPrice, maxPrice };
}

/**
 * Turns URL state into Shopify ProductFilter inputs using the filter
 * definitions Shopify returned. Ids Shopify doesn't know are ignored.
 */
export function toProductFilters(params: ShopParams, groups: FilterGroup[]): Record<string, unknown>[] {
  const inputsById = new Map<string, string>();
  for (const group of groups) {
    if (group.type === "PRICE_RANGE") continue;
    for (const value of group.values) inputsById.set(value.id, value.input);
  }

  const filters: Record<string, unknown>[] = [];
  for (const id of params.filterIds) {
    const input = inputsById.get(id);
    if (!input) continue;
    try {
      filters.push(JSON.parse(input) as Record<string, unknown>);
    } catch {
      // Shopify always sends valid JSON; skip anything that isn't.
    }
  }

  if (params.minPrice !== null || params.maxPrice !== null) {
    filters.push({
      price: {
        ...(params.minPrice !== null && { min: params.minPrice }),
        ...(params.maxPrice !== null && { max: params.maxPrice }),
      },
    });
  }
  return filters;
}

/**
 * Shopify search text for the current state. Categories use Shopify's
 * product_type: search syntax, because the search API only honours
 * productType *filters* once they're enabled in the Search & Discovery app.
 */
export function searchQuery(params: ShopParams): string {
  const category = categoryBySlug(params.category);
  const parts = [params.q ?? ""];
  if (category) parts.push(`product_type:"${category.productType}"`);
  return parts.filter(Boolean).join(" ");
}

/** Builds a /shop URL from state, omitting defaults to keep links short. */
export function shopHref(params: ShopParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.sort !== "featured") search.set("sort", params.sort);
  for (const id of params.filterIds) search.append("filter", id);
  if (params.minPrice !== null) search.set("min", String(params.minPrice));
  if (params.maxPrice !== null) search.set("max", String(params.maxPrice));
  const qs = search.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

/** Counts sidebar filters (availability, price). Category and search are shown separately. */
export function activeFilterCount(params: ShopParams): number {
  return params.filterIds.length + (params.minPrice !== null || params.maxPrice !== null ? 1 : 0);
}
