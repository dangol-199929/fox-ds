import { describe, expect, it } from "vitest";
import { activeFilterCount, parseShopParams, searchQuery, shopHref, toProductFilters } from "@/lib/shop-params";
import type { FilterGroup } from "@/lib/shopify/search-options";

const groups: FilterGroup[] = [
  {
    id: "filter.v.availability",
    label: "Availability",
    type: "LIST",
    values: [
      { id: "filter.v.availability.1", label: "In stock", count: 3, input: '{"available":true}' },
      { id: "filter.v.availability.0", label: "Out of stock", count: 1, input: '{"available":false}' },
    ],
  },
  {
    id: "filter.p.product_type",
    label: "Product type",
    type: "LIST",
    values: [
      { id: "filter.p.product_type.Clips", label: "Clips", count: 2, input: '{"productType":"Clips"}' },
    ],
  },
  {
    id: "filter.v.price",
    label: "Price",
    type: "PRICE_RANGE",
    values: [{ id: "filter.v.price", label: "Price", count: 0, input: '{"price":{"min":0,"max":50}}' }],
  },
];

describe("parseShopParams", () => {
  it("defaults to featured with no filters", () => {
    expect(parseShopParams({})).toEqual({
      q: null,
      category: null,
      sort: "featured",
      filterIds: [],
      minPrice: null,
      maxPrice: null,
    });
  });

  it("reads sort, repeated filters and a price range", () => {
    expect(
      parseShopParams({
        sort: "price-desc",
        filter: ["filter.v.availability.1", "filter.p.product_type.Clips"],
        min: "10",
        max: "40.5",
      }),
    ).toEqual({
      q: null,
      category: null,
      sort: "price-desc",
      filterIds: ["filter.v.availability.1", "filter.p.product_type.Clips"],
      minPrice: 10,
      maxPrice: 40.5,
    });
  });

  it("falls back to featured for an unsupported sort such as newest", () => {
    expect(parseShopParams({ sort: "newest" }).sort).toBe("featured");
  });

  it("drops malformed filter ids and de-duplicates", () => {
    const { filterIds } = parseShopParams({
      filter: ['{"available":true}', "filter.v.availability.1", "filter.v.availability.1", "javascript:alert(1)"],
    });
    expect(filterIds).toEqual(["filter.v.availability.1"]);
  });

  it("ignores negative, non-numeric and absurd prices, and swaps an inverted range", () => {
    expect(parseShopParams({ min: "-5", max: "abc" })).toMatchObject({ minPrice: null, maxPrice: null });
    expect(parseShopParams({ max: "1e9" }).maxPrice).toBeNull();
    expect(parseShopParams({ min: "50", max: "10" })).toMatchObject({ minPrice: 10, maxPrice: 50 });
  });
});

describe("search and category", () => {
  it("trims, collapses and length-limits the search query", () => {
    expect(parseShopParams({ q: "  laptop   stand " }).q).toBe("laptop stand");
    expect(parseShopParams({ q: "   " }).q).toBeNull();
    expect(parseShopParams({ q: "x".repeat(500) }).q).toHaveLength(100);
  });

  it("only accepts known category slugs", () => {
    expect(parseShopParams({ category: "desk-mats" }).category).toBe("desk-mats");
    expect(parseShopParams({ category: "secret-stuff" }).category).toBeNull();
    expect(parseShopParams({ category: ["lighting", "desk-mats"] }).category).toBe("lighting");
  });

  it("turns a category into Shopify's product_type search syntax", () => {
    expect(searchQuery(parseShopParams({}))).toBe("");
    expect(searchQuery(parseShopParams({ q: "stand" }))).toBe("stand");
    expect(searchQuery(parseShopParams({ category: "stands-risers" }))).toBe('product_type:"Stands & risers"');
    expect(searchQuery(parseShopParams({ q: "black", category: "desk-mats" }))).toBe('black product_type:"Desk mats"');
  });

  it("keeps search and category in links, but not in the sidebar filter count", () => {
    const params = parseShopParams({ q: "mat", category: "desk-mats", sort: "price-asc" });
    const href = shopHref(params);
    expect(href).toBe("/shop?q=mat&category=desk-mats&sort=price-asc");
    expect(parseShopParams(Object.fromEntries(new URL(href, "http://x").searchParams))).toEqual(params);
    expect(activeFilterCount(params)).toBe(0);
  });
});

describe("toProductFilters", () => {
  it("combines multiple selected filters using Shopify's own inputs", () => {
    const params = parseShopParams({
      filter: ["filter.v.availability.1", "filter.p.product_type.Clips"],
      min: "5",
    });
    expect(toProductFilters(params, groups)).toEqual([
      { available: true },
      { productType: "Clips" },
      { price: { min: 5 } },
    ]);
  });

  it("ignores ids Shopify didn't offer, so the URL can't inject filter JSON", () => {
    const params = parseShopParams({ filter: ["filter.p.m.custom.secret"] });
    expect(toProductFilters(params, groups)).toEqual([]);
  });
});

describe("shopHref and activeFilterCount", () => {
  it("round-trips state through the URL and omits defaults", () => {
    expect(shopHref(parseShopParams({}))).toBe("/shop");
    const params = parseShopParams({ sort: "price-asc", filter: "filter.v.availability.1", max: "30" });
    const href = shopHref(params);
    expect(href).toBe("/shop?sort=price-asc&filter=filter.v.availability.1&max=30");
    const reparsed = parseShopParams(Object.fromEntries(new URL(href, "http://x").searchParams));
    expect(reparsed).toEqual(params);
    expect(activeFilterCount(params)).toBe(2);
  });
});
