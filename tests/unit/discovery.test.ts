import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRecommendedProducts, pickRecommendations } from "@/lib/shopify/recommendations";
import { reshapeProduct } from "@/lib/shopify/reshape";
import { searchProducts } from "@/lib/shopify/search";
import { graphqlOk, rawProduct, requestBody, TEST_ENV } from "../support/shopify-fixtures";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  for (const [key, value] of Object.entries(TEST_ENV)) vi.stubEnv(key, value);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const product = (handle: string, availableForSale = true) =>
  reshapeProduct(rawProduct({ handle, id: `gid://shopify/Product/${handle}`, availableForSale }));

describe("searchProducts", () => {
  it("maps sort options to Shopify sort keys and passes filters through", async () => {
    fetchMock.mockResolvedValueOnce(
      graphqlOk({ search: { totalCount: 1, productFilters: [], nodes: [rawProduct()] } }),
    );

    const result = await searchProducts({ sort: "price-desc", productFilters: [{ available: true }] });

    expect(result.products).toHaveLength(1);
    expect(requestBody(fetchMock.mock.calls[0]!).variables).toMatchObject({
      sortKey: "PRICE",
      reverse: true,
      productFilters: [{ available: true }],
      country: "AU",
    });
  });

  it("returns an empty list (not an error) when nothing matches", async () => {
    fetchMock.mockResolvedValueOnce(graphqlOk({ search: { totalCount: 0, productFilters: [], nodes: [] } }));
    const result = await searchProducts({ productFilters: [{ available: false }] });
    expect(result).toMatchObject({ products: [], totalCount: 0 });
  });
});

describe("pickRecommendations", () => {
  it("removes the current product, duplicates and unavailable products", () => {
    const picked = pickRecommendations(
      [product("clean-desk-kit"), product("clips"), product("clips"), product("sleeve", false), product("tray")],
      "clean-desk-kit",
      4,
    );
    expect(picked.map((p) => p.handle)).toEqual(["clips", "tray"]);
  });

  it("respects the limit", () => {
    const picked = pickRecommendations([product("a"), product("b"), product("c")], "x", 2);
    expect(picked.map((p) => p.handle)).toEqual(["a", "b"]);
  });
});

describe("getRecommendedProducts", () => {
  it("falls back to the featured collection when Shopify has no recommendations", async () => {
    fetchMock.mockImplementation(async (_url, init) => {
      const { query } = JSON.parse(init!.body as string) as { query: string };
      if (query.includes("productRecommendations")) return graphqlOk({ productRecommendations: [] });
      return graphqlOk({
        collection: {
          handle: "frontpage",
          title: "Home page",
          description: "",
          products: { nodes: [rawProduct(), rawProduct({ handle: "clips", id: "gid://shopify/Product/2" })] },
        },
      });
    });

    const products = await getRecommendedProducts("clean-desk-kit", { fallbackCollection: "frontpage" });
    expect(products.map((p) => p.handle)).toEqual(["clips"]);
  });

  it("returns nothing, rather than breaking the page, when Shopify fails", async () => {
    fetchMock.mockResolvedValue(new Response("down", { status: 500 }));
    await expect(
      getRecommendedProducts("clean-desk-kit", { fallbackCollection: "frontpage" }),
    ).resolves.toEqual([]);
  });
});
