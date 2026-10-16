// Test fixtures shaped like Storefront API responses. Fake IDs only.

import type { RawCart, RawProduct } from "@/lib/shopify/reshape";

export const TEST_ENV = {
  SHOPIFY_STORE_DOMAIN: "clean-desk-kit-test.myshopify.com",
  SHOPIFY_STOREFRONT_API_VERSION: "2026-10",
  SHOPIFY_STOREFRONT_PUBLIC_TOKEN: "test-token-should-never-appear-in-errors",
};

export const VARIANT_ID = "gid://shopify/ProductVariant/1001";
export const SOLD_OUT_VARIANT_ID = "gid://shopify/ProductVariant/1002";
export const CART_ID = "gid://shopify/Cart/hWN1abcDEF?key=k3y123";
export const LINE_ID = "gid://shopify/CartLine/0a1b2c3d-4e5f?cart=hWN1abcDEF";

const aud = (amount: string) => ({ amount, currencyCode: "AUD" });

export function rawProduct(overrides: Partial<RawProduct> = {}): RawProduct {
  return {
    id: "gid://shopify/Product/1",
    handle: "clean-desk-kit",
    title: "Clean Desk Kit",
    description: "A cable-management bundle.",
    descriptionHtml: "<p>A cable-management bundle.</p>",
    availableForSale: true,
    productType: "",
    tags: [],
    vendor: "My Store",
    updatedAt: "2026-10-16T00:00:00Z",
    options: [{ name: "Colour", optionValues: [{ name: "Charcoal" }, { name: "White" }] }],
    priceRange: { minVariantPrice: aud("29.95"), maxVariantPrice: aud("29.95") },
    featuredImage: null,
    images: { nodes: [] },
    variants: {
      nodes: [
        {
          id: VARIANT_ID,
          title: "Charcoal",
          availableForSale: true,
          currentlyNotInStock: false,
          selectedOptions: [{ name: "Colour", value: "Charcoal" }],
          price: aud("29.95"),
          compareAtPrice: null,
          image: null,
        },
        {
          id: SOLD_OUT_VARIANT_ID,
          title: "White",
          availableForSale: false,
          currentlyNotInStock: true,
          selectedOptions: [{ name: "Colour", value: "White" }],
          price: aud("29.95"),
          compareAtPrice: null,
          image: null,
        },
      ],
    },
    seo: { title: null, description: null },
    ...overrides,
  };
}

export function rawCart({
  quantity = 1,
  checkoutUrl = "https://clean-desk-kit-test.myshopify.com/cart/c/abc?key=k3y123",
}: { quantity?: number; checkoutUrl?: string } = {}): RawCart {
  const lineTotal = (29.95 * quantity).toFixed(2);
  return {
    id: CART_ID,
    checkoutUrl,
    totalQuantity: quantity,
    cost: { subtotalAmount: aud(lineTotal), totalAmount: aud(lineTotal) },
    lines: {
      nodes:
        quantity === 0
          ? []
          : [
              {
                id: LINE_ID,
                quantity,
                cost: { totalAmount: aud(lineTotal), amountPerQuantity: aud("29.95") },
                merchandise: {
                  id: VARIANT_ID,
                  title: "Charcoal",
                  availableForSale: true,
                  selectedOptions: [{ name: "Colour", value: "Charcoal" }],
                  image: null,
                  product: { handle: "clean-desk-kit", title: "Clean Desk Kit" },
                },
              },
            ],
    },
  };
}

export function graphqlOk(data: unknown) {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function cartPayload(cart: RawCart | null, extra: { userErrors?: unknown[]; warnings?: unknown[] } = {}) {
  return { cart, userErrors: extra.userErrors ?? [], warnings: extra.warnings ?? [] };
}

/** Parses the GraphQL request body a mocked fetch received. */
export function requestBody(call: unknown[]): { query: string; variables: Record<string, unknown> } {
  const init = call[1] as RequestInit;
  return JSON.parse(init.body as string);
}
