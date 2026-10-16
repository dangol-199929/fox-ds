// Shared by server and client code (no server-only imports here).

export type FilterValue = { id: string; label: string; count: number; input: string };
export type FilterGroup = {
  id: string;
  label: string;
  type: "LIST" | "PRICE_RANGE" | "BOOLEAN";
  values: FilterValue[];
};

/** Sort options we can implement accurately with Shopify's search API. */
export const SORT_OPTIONS = [
  { value: "featured", label: "Featured", sortKey: "RELEVANCE", reverse: false },
  { value: "price-asc", label: "Price: low to high", sortKey: "PRICE", reverse: false },
  { value: "price-desc", label: "Price: high to low", sortKey: "PRICE", reverse: true },
] as const;
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
