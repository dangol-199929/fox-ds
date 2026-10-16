import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCollectionProducts, getProduct, getProducts } from "@/lib/shopify/products";
import { hasRealOptions, reshapeProduct } from "@/lib/shopify/reshape";
import { graphqlOk, rawProduct, requestBody, TEST_ENV } from "../support/shopify-fixtures";

// The "use cache" directive is inert outside Next.js; its helpers must be stubbed.
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

describe("getProduct", () => {
  it("returns a reshaped product with option values and variants", async () => {
    fetchMock.mockResolvedValueOnce(graphqlOk({ product: rawProduct() }));

    const product = await getProduct("clean-desk-kit");

    expect(product?.title).toBe("Clean Desk Kit");
    expect(product?.options).toEqual([{ name: "Colour", values: ["Charcoal", "White"] }]);
    expect(product?.variants.map((v) => v.availableForSale)).toEqual([true, false]);
    expect(requestBody(fetchMock.mock.calls[0]!).variables).toEqual({
      handle: "clean-desk-kit",
      country: "AU",
    });
  });

  it("returns null for a product that doesn't exist", async () => {
    fetchMock.mockResolvedValueOnce(graphqlOk({ product: null }));
    expect(await getProduct("no-such-product")).toBeNull();
  });

  it.each(["../admin", "Clean Desk Kit", "", "a".repeat(300), "kit?x=1"])(
    "returns null for an invalid handle %j without calling Shopify",
    async (handle) => {
      expect(await getProduct(handle)).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("surfaces API failures as errors instead of an empty product", async () => {
    fetchMock.mockResolvedValue(new Response("down", { status: 502 }));
    await expect(getProduct("clean-desk-kit")).rejects.toMatchObject({ kind: "http" });
  });
});

describe("getProducts", () => {
  it("clamps the page size and falls back to a known sort key", async () => {
    fetchMock.mockResolvedValueOnce(graphqlOk({ products: { nodes: [rawProduct()] } }));

    const products = await getProducts({ first: 500, sortKey: "DROP TABLE" as never });

    expect(products).toHaveLength(1);
    expect(requestBody(fetchMock.mock.calls[0]!).variables).toMatchObject({
      first: 100,
      sortKey: "BEST_SELLING",
    });
  });
});

describe("getCollectionProducts", () => {
  it("returns null for a missing collection", async () => {
    fetchMock.mockResolvedValueOnce(graphqlOk({ collection: null }));
    expect(await getCollectionProducts("featured")).toBeNull();
  });
});

describe("hasRealOptions", () => {
  it("hides Shopify's placeholder 'Default Title' option", () => {
    const single = reshapeProduct(
      rawProduct({
        options: [{ name: "Title", optionValues: [{ name: "Default Title" }] }],
        variants: { nodes: [rawProduct().variants.nodes[0]!] },
      }),
    );
    expect(hasRealOptions(single)).toBe(false);
  });

  it("keeps real choices such as colour", () => {
    expect(hasRealOptions(reshapeProduct(rawProduct()))).toBe(true);
  });
});
