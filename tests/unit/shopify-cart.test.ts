import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addCartLine,
  createCart,
  getCart,
  MAX_LINE_QUANTITY,
  removeCartLine,
  updateCartLine,
} from "@/lib/shopify/cart";
import {
  CART_ID,
  cartPayload,
  graphqlOk,
  LINE_ID,
  rawCart,
  requestBody,
  SOLD_OUT_VARIANT_ID,
  TEST_ENV,
  VARIANT_ID,
} from "../support/shopify-fixtures";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  for (const [key, value] of Object.entries(TEST_ENV)) vi.stubEnv(key, value);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cart input validation (before anything reaches Shopify)", () => {
  it.each([0, -1, 1.5, MAX_LINE_QUANTITY + 1, Number.NaN, "abc", null])(
    "rejects add quantity %s",
    async (quantity) => {
      await expect(addCartLine(CART_ID, VARIANT_ID, quantity as number)).rejects.toMatchObject({
        kind: "invalid_input",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([-1, 2.5, MAX_LINE_QUANTITY + 1])("rejects update quantity %s", async (quantity) => {
    await expect(updateCartLine(CART_ID, LINE_ID, quantity)).rejects.toMatchObject({
      kind: "invalid_input",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    "gid://shopify/Product/1",
    "gid://shopify/ProductVariant/abc",
    "1001",
    'gid://shopify/ProductVariant/1"}',
  ])("rejects malformed variant id %s", async (variantId) => {
    await expect(addCartLine(CART_ID, variantId, 1)).rejects.toMatchObject({
      kind: "invalid_input",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["not-a-cart", "gid://shopify/Cart/../../admin", "gid://shopify/Checkout/abc"])(
    "rejects malformed cart id %s",
    async (cartId) => {
      await expect(addCartLine(cartId, VARIANT_ID, 1)).rejects.toMatchObject({
        kind: "invalid_input",
      });
      expect(await getCart(cartId)).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("rejects a malformed line id on update and remove", async () => {
    await expect(updateCartLine(CART_ID, "line-1", 2)).rejects.toMatchObject({ kind: "invalid_input" });
    await expect(removeCartLine(CART_ID, "line-1")).rejects.toMatchObject({ kind: "invalid_input" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("cart operations", () => {
  it("creates a cart with the requested line and returns reshaped lines", async () => {
    fetchMock.mockResolvedValueOnce(graphqlOk({ cartCreate: cartPayload(rawCart()) }));

    const { cart, warnings } = await createCart([{ merchandiseId: VARIANT_ID, quantity: 1 }]);

    expect(cart.totalQuantity).toBe(1);
    expect(cart.lines[0]?.merchandise.product.handle).toBe("clean-desk-kit");
    expect(cart.cost.subtotalAmount).toEqual({ amount: "29.95", currencyCode: "AUD" });
    expect(warnings).toEqual([]);

    const body = requestBody(fetchMock.mock.calls[0]!);
    expect(body.query).toContain("cartCreate");
    expect(body.variables).toMatchObject({
      input: { lines: [{ merchandiseId: VARIANT_ID, quantity: 1 }] },
      country: "AU",
    });
  });

  it("turns Shopify userErrors (e.g. an unavailable variant) into a user error", async () => {
    fetchMock.mockResolvedValueOnce(
      graphqlOk({
        cartLinesAdd: cartPayload(rawCart(), {
          userErrors: [
            {
              code: "INVALID",
              field: ["lines", "0", "merchandiseId"],
              message: "The merchandise with id gid://shopify/ProductVariant/1002 does not exist.",
            },
          ],
        }),
      }),
    );

    await expect(addCartLine(CART_ID, SOLD_OUT_VARIANT_ID, 1)).rejects.toMatchObject({
      kind: "user",
      message: expect.stringContaining("INVALID"),
    });
  });

  it("passes Shopify's stock warnings through to the caller", async () => {
    const warning = {
      code: "MERCHANDISE_NOT_ENOUGH_STOCK",
      message: "Only 10 items were added to your cart due to availability.",
    };
    fetchMock.mockResolvedValueOnce(
      graphqlOk({ cartLinesUpdate: cartPayload(rawCart({ quantity: 10 }), { warnings: [warning] }) }),
    );

    const result = await updateCartLine(CART_ID, LINE_ID, 15);
    expect(result.cart.totalQuantity).toBe(10);
    expect(result.warnings).toEqual([warning]);
  });

  it("removes the line when the quantity is updated to 0", async () => {
    fetchMock.mockResolvedValueOnce(graphqlOk({ cartLinesRemove: cartPayload(rawCart({ quantity: 0 })) }));

    const result = await updateCartLine(CART_ID, LINE_ID, 0);

    expect(result.cart.lines).toEqual([]);
    const body = requestBody(fetchMock.mock.calls[0]!);
    expect(body.query).toContain("cartLinesRemove");
    expect(body.variables.lineIds).toEqual([LINE_ID]);
  });

  it("returns null for a cart Shopify no longer has", async () => {
    fetchMock.mockResolvedValueOnce(graphqlOk({ cart: null }));
    expect(await getCart(CART_ID)).toBeNull();
  });

  it("reports an expired cart on a mutation as not found", async () => {
    fetchMock.mockResolvedValueOnce(graphqlOk({ cartLinesAdd: cartPayload(null) }));
    await expect(addCartLine(CART_ID, VARIANT_ID, 1)).rejects.toMatchObject({
      kind: "not_found",
      publicMessage: expect.stringContaining("expired"),
    });
  });
});
