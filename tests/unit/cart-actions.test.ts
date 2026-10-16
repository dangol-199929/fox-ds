import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CART_ID,
  cartPayload,
  graphqlOk,
  LINE_ID,
  rawCart,
  requestBody,
  TEST_ENV,
  VARIANT_ID,
} from "../support/shopify-fixtures";

// In-memory stand-in for Next's request cookies.
const jar = new Map<string, { value: string; options?: Record<string, unknown> }>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)!.value } : undefined),
    set: (name: string, value: string, options?: Record<string, unknown>) =>
      void jar.set(name, { value, options }),
    delete: (name: string) => void jar.delete(name),
  }),
}));

class RedirectSignal extends Error {
  constructor(public readonly url: string) {
    super(`redirect:${url}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectSignal(url);
  },
}));

const { addToCart, goToCheckout, removeFromCart, updateCartQuantity } = await import(
  "@/app/actions/cart"
);
const { CART_COOKIE } = await import("@/lib/shopify/cart-session");

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  for (const [key, value] of Object.entries(TEST_ENV)) vi.stubEnv(key, value);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  jar.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("addToCart", () => {
  it("creates a cart and stores its id in an HttpOnly cookie", async () => {
    fetchMock.mockResolvedValueOnce(graphqlOk({ cartCreate: cartPayload(rawCart()) }));

    const result = await addToCart({ variantId: VARIANT_ID, quantity: 1 });

    expect(result).toMatchObject({ ok: true, cart: { totalQuantity: 1 } });
    const cookie = jar.get(CART_COOKIE);
    expect(cookie?.value).toBe(CART_ID);
    expect(cookie?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("ignores a cart id smuggled in the request and uses only the cookie", async () => {
    fetchMock.mockResolvedValueOnce(graphqlOk({ cartCreate: cartPayload(rawCart()) }));

    await addToCart({
      variantId: VARIANT_ID,
      quantity: 1,
      cartId: "gid://shopify/Cart/someone-elses-cart?key=stolen",
    });

    const body = requestBody(fetchMock.mock.calls[0]!);
    expect(body.query).toContain("cartCreate");
    expect(JSON.stringify(body)).not.toContain("someone-elses-cart");
  });

  it("adds to the existing cart from the cookie", async () => {
    jar.set(CART_COOKIE, { value: CART_ID });
    fetchMock
      .mockResolvedValueOnce(graphqlOk({ cart: rawCart({ quantity: 1 }) }))
      .mockResolvedValueOnce(graphqlOk({ cartLinesAdd: cartPayload(rawCart({ quantity: 2 })) }));

    const result = await addToCart({ variantId: VARIANT_ID, quantity: 1 });

    expect(result).toMatchObject({ ok: true, cart: { totalQuantity: 2 } });
    expect(requestBody(fetchMock.mock.calls[1]!).variables.cartId).toBe(CART_ID);
  });

  it("starts a fresh cart when the cookie's cart has expired", async () => {
    jar.set(CART_COOKIE, { value: CART_ID });
    fetchMock
      .mockResolvedValueOnce(graphqlOk({ cart: null }))
      .mockResolvedValueOnce(graphqlOk({ cartCreate: cartPayload(rawCart()) }));

    const result = await addToCart({ variantId: VARIANT_ID, quantity: 1 });

    expect(result.ok).toBe(true);
    expect(requestBody(fetchMock.mock.calls[1]!).query).toContain("cartCreate");
  });

  it("refuses to go over the per-item limit across repeated adds", async () => {
    jar.set(CART_COOKIE, { value: CART_ID });
    fetchMock.mockResolvedValueOnce(graphqlOk({ cart: rawCart({ quantity: 19 }) }));

    const result = await addToCart({ variantId: VARIANT_ID, quantity: 2 });

    expect(result).toEqual({ ok: false, error: "You can have up to 20 of this item in your cart." });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    { variantId: VARIANT_ID, quantity: 0 },
    { variantId: VARIANT_ID, quantity: 21 },
    { variantId: VARIANT_ID, quantity: "lots" },
    { variantId: "<script>", quantity: 1 },
    null,
    "VARIANT",
  ])("rejects invalid input %j without calling Shopify", async (input) => {
    const result = await addToCart(input);
    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a friendly message, not internals, when Shopify is down", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const result = await addToCart({ variantId: VARIANT_ID, quantity: 1 });

    expect(result).toEqual({
      ok: false,
      error: "We couldn't reach the store. Check your connection and try again.",
    });
  });
});

describe("updateCartQuantity and removeFromCart", () => {
  it("only changes lines that belong to the cookie's cart", async () => {
    jar.set(CART_COOKIE, { value: CART_ID });
    fetchMock.mockResolvedValueOnce(graphqlOk({ cart: rawCart() }));

    const result = await updateCartQuantity({
      lineId: "gid://shopify/CartLine/not-in-this-cart?cart=other",
      quantity: 3,
    });

    expect(result).toEqual({ ok: false, error: "That item is no longer in your cart." });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("updates a line in the cart", async () => {
    jar.set(CART_COOKIE, { value: CART_ID });
    fetchMock
      .mockResolvedValueOnce(graphqlOk({ cart: rawCart() }))
      .mockResolvedValueOnce(graphqlOk({ cartLinesUpdate: cartPayload(rawCart({ quantity: 3 })) }));

    const result = await updateCartQuantity({ lineId: LINE_ID, quantity: 3 });
    expect(result).toMatchObject({ ok: true, cart: { totalQuantity: 3 } });
  });

  it("removes a line in the cart", async () => {
    jar.set(CART_COOKIE, { value: CART_ID });
    fetchMock
      .mockResolvedValueOnce(graphqlOk({ cart: rawCart() }))
      .mockResolvedValueOnce(graphqlOk({ cartLinesRemove: cartPayload(rawCart({ quantity: 0 })) }));

    const result = await removeFromCart({ lineId: LINE_ID });
    expect(result).toMatchObject({ ok: true, cart: { totalQuantity: 0, lines: [] } });
  });

  it("clears the cookie when the cart has expired", async () => {
    jar.set(CART_COOKIE, { value: CART_ID });
    fetchMock.mockResolvedValueOnce(graphqlOk({ cart: null }));

    const result = await removeFromCart({ lineId: LINE_ID });

    expect(result.ok).toBe(false);
    expect(jar.has(CART_COOKIE)).toBe(false);
  });

  it("rejects a negative quantity", async () => {
    const result = await updateCartQuantity({ lineId: LINE_ID, quantity: -2 });
    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("goToCheckout", () => {
  it("redirects to Shopify's checkout URL for the cookie's cart", async () => {
    jar.set(CART_COOKIE, { value: CART_ID });
    fetchMock.mockResolvedValueOnce(graphqlOk({ cart: rawCart() }));

    const error = await goToCheckout().catch((e) => e);

    expect(error).toBeInstanceOf(RedirectSignal);
    expect(error.url).toBe("https://clean-desk-kit-test.myshopify.com/cart/c/abc?key=k3y123");
  });

  it("does not redirect for an empty cart", async () => {
    jar.set(CART_COOKIE, { value: CART_ID });
    fetchMock.mockResolvedValueOnce(graphqlOk({ cart: rawCart({ quantity: 0 }) }));

    await expect(goToCheckout()).resolves.toEqual({ ok: false, error: "Your cart is empty." });
  });

  it("does not redirect when there is no cart cookie", async () => {
    await expect(goToCheckout()).resolves.toEqual({ ok: false, error: "Your cart is empty." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a checkout URL on an unexpected domain", async () => {
    jar.set(CART_COOKIE, { value: CART_ID });
    fetchMock.mockResolvedValueOnce(
      graphqlOk({ cart: rawCart({ checkoutUrl: "https://phishing.example/cart/c/abc" }) }),
    );

    const result = await goToCheckout();

    expect(result).toEqual({
      ok: false,
      error: "Checkout isn't available right now. Please try again shortly.",
    });
  });
});
