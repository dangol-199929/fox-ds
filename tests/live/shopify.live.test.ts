import { describe, expect, it, vi } from "vitest";
import {
  addCartLine,
  createCart,
  getCart,
  removeCartLine,
  updateCartLine,
} from "@/lib/shopify/cart";
import { checkoutHostsFrom, validateCheckoutUrl } from "@/lib/shopify/checkout";
import { getProduct, getProducts } from "@/lib/shopify/products";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

// Set LIVE_PRODUCT_HANDLE to check a different product.
const HANDLE = process.env.LIVE_PRODUCT_HANDLE ?? "clean-desk-kit";

describe("live Shopify store", () => {
  it("reads the product with AUD pricing", async () => {
    const product = await getProduct(HANDLE);
    expect(product, `product "${HANDLE}" should exist and be on the Headless channel`).not.toBeNull();
    expect(product!.priceRange.minVariantPrice.currencyCode).toBe("AUD");
    expect(product!.variants.length).toBeGreaterThan(0);
  });

  it("lists products", async () => {
    expect((await getProducts({ first: 5 })).length).toBeGreaterThan(0);
  });

  it("returns null for a product that doesn't exist", async () => {
    expect(await getProduct("this-product-does-not-exist-cdk")).toBeNull();
  });

  it("runs a full cart round trip and produces a valid checkout URL", async () => {
    const product = await getProduct(HANDLE);
    const variant = product!.variants.find((v) => v.availableForSale);
    expect(variant, "at least one variant should be available for sale").toBeDefined();

    const created = await createCart([{ merchandiseId: variant!.id, quantity: 1 }]);
    expect(created.cart.totalQuantity).toBe(1);
    expect(created.cart.cost.subtotalAmount.currencyCode).toBe("AUD");

    const added = await addCartLine(created.cart.id, variant!.id, 1);
    expect(added.cart.totalQuantity).toBe(2);

    const line = added.cart.lines[0]!;
    const updated = await updateCartLine(added.cart.id, line.id, 3);
    expect(updated.cart.totalQuantity).toBe(3);

    const fetched = await getCart(created.cart.id);
    expect(fetched?.totalQuantity).toBe(3);

    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN!;
    const checkoutUrl = validateCheckoutUrl(
      fetched!.checkoutUrl,
      checkoutHostsFrom(storeDomain, process.env.SHOPIFY_CHECKOUT_DOMAINS),
    );
    expect(checkoutUrl.startsWith("https://")).toBe(true);

    const removed = await removeCartLine(created.cart.id, line.id);
    expect(removed.cart.totalQuantity).toBe(0);
  });

  it("rejects a variant that doesn't exist", async () => {
    const { cart } = await createCart();
    await expect(
      addCartLine(cart.id, "gid://shopify/ProductVariant/1", 1),
    ).rejects.toMatchObject({ kind: "user" });
  });
});

describe("live discovery", () => {
  it("searches with Shopify's filters and sorting", async () => {
    vi.resetModules();
    const { searchProducts } = await import("@/lib/shopify/search");
    const base = await searchProducts();
    expect(base.totalCount).toBeGreaterThan(0);
    expect(base.filters.map((f) => f.id)).toContain("filter.v.availability");

    const inStock = await searchProducts({ sort: "price-asc", productFilters: [{ available: true }] });
    expect(inStock.products.every((p) => p.availableForSale)).toBe(true);

    const none = await searchProducts({ productFilters: [{ price: { min: 99999 } }] });
    expect(none.products).toEqual([]);
  });
});
