import "server-only";
import { z } from "zod";
import { shopifyFetch } from "./client";
import { invalidInput, notFound, userError, type ShopifyUserError } from "./errors";
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
  STORE_COUNTRY,
} from "./queries";
import { type RawCart, reshapeCart } from "./reshape";
import type { Cart, CartResult, CartWarning } from "./types";

/**
 * Cart operations. Customer-specific, so never cached.
 *
 * Every input is validated here on the server, whatever the UI already
 * checked. Cart IDs only ever come from our own HttpOnly cookie (see
 * cart-session.ts), never from a client payload.
 */

/** Highest quantity of one variant per cart line. Small kit, small orders. */
export const MAX_LINE_QUANTITY = 20;

// gid://shopify/Cart/<token>?key=<key>
const CART_ID = /^gid:\/\/shopify\/Cart\/[A-Za-z0-9_-]{1,128}(\?key=[A-Za-z0-9_-]{1,128})?$/;
// gid://shopify/ProductVariant/<number>
const VARIANT_ID = /^gid:\/\/shopify\/ProductVariant\/\d{1,20}$/;
// gid://shopify/CartLine/<uuid>?cart=<token>
const CART_LINE_ID = /^gid:\/\/shopify\/CartLine\/[A-Za-z0-9_-]{1,128}(\?cart=[A-Za-z0-9_-]{1,128})?$/;

export const cartIdSchema = z.string().regex(CART_ID);
export const variantIdSchema = z.string().regex(VARIANT_ID);
export const cartLineIdSchema = z.string().regex(CART_LINE_ID);

/** Quantity being added: whole number, 1 to MAX_LINE_QUANTITY. */
export const addQuantitySchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_LINE_QUANTITY);

/** New quantity for an existing line: 0 (remove) to MAX_LINE_QUANTITY. */
export const updateQuantitySchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(MAX_LINE_QUANTITY);

export function isValidCartId(value: unknown): value is string {
  return cartIdSchema.safeParse(value).success;
}

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, what: string, publicMessage: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw invalidInput(what, publicMessage);
  return result.data;
}

const QUANTITY_MESSAGE = `Choose a quantity between 1 and ${MAX_LINE_QUANTITY}.`;

type CartPayload = {
  cart: RawCart | null;
  userErrors: ShopifyUserError[];
  warnings: CartWarning[];
};

function unwrap(payload: CartPayload): CartResult {
  if (payload.userErrors.length) throw userError(payload.userErrors);
  if (!payload.cart) throw notFound("Cart", "Your cart has expired. Please add the item again.");
  return { cart: reshapeCart(payload.cart), warnings: payload.warnings };
}

/** Returns the cart, or null if Shopify no longer has it (expired or unknown). */
export async function getCart(cartId: string): Promise<Cart | null> {
  if (!isValidCartId(cartId)) return null;
  const data = await shopifyFetch<{ cart: RawCart | null }>({
    query: CART_QUERY,
    variables: { cartId, country: STORE_COUNTRY },
    retry: true,
  });
  return data.cart ? reshapeCart(data.cart) : null;
}

export async function createCart(
  lines: { merchandiseId: string; quantity: number }[] = [],
): Promise<CartResult> {
  const validLines = lines.map((line) => ({
    merchandiseId: parseOrThrow(variantIdSchema, line.merchandiseId, "variant id", "That product option isn't available."),
    quantity: parseOrThrow(addQuantitySchema, line.quantity, "quantity", QUANTITY_MESSAGE),
  }));

  const data = await shopifyFetch<{ cartCreate: CartPayload }>({
    query: CART_CREATE_MUTATION,
    variables: { input: { lines: validLines }, country: STORE_COUNTRY },
  });
  return unwrap(data.cartCreate);
}

export async function addCartLine(
  cartId: string,
  merchandiseId: string,
  quantity: number,
): Promise<CartResult> {
  const id = parseOrThrow(cartIdSchema, cartId, "cart id", "Your cart couldn't be found.");
  const variant = parseOrThrow(variantIdSchema, merchandiseId, "variant id", "That product option isn't available.");
  const qty = parseOrThrow(addQuantitySchema, quantity, "quantity", QUANTITY_MESSAGE);

  const data = await shopifyFetch<{ cartLinesAdd: CartPayload }>({
    query: CART_LINES_ADD_MUTATION,
    variables: { cartId: id, lines: [{ merchandiseId: variant, quantity: qty }], country: STORE_COUNTRY },
  });
  return unwrap(data.cartLinesAdd);
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<CartResult> {
  const id = parseOrThrow(cartIdSchema, cartId, "cart id", "Your cart couldn't be found.");
  const line = parseOrThrow(cartLineIdSchema, lineId, "cart line id", "That item is no longer in your cart.");
  const qty = parseOrThrow(updateQuantitySchema, quantity, "quantity", `Choose a quantity between 0 and ${MAX_LINE_QUANTITY}.`);

  if (qty === 0) return removeCartLine(id, line);

  const data = await shopifyFetch<{ cartLinesUpdate: CartPayload }>({
    query: CART_LINES_UPDATE_MUTATION,
    variables: { cartId: id, lines: [{ id: line, quantity: qty }], country: STORE_COUNTRY },
  });
  return unwrap(data.cartLinesUpdate);
}

export async function removeCartLine(cartId: string, lineId: string): Promise<CartResult> {
  const id = parseOrThrow(cartIdSchema, cartId, "cart id", "Your cart couldn't be found.");
  const line = parseOrThrow(cartLineIdSchema, lineId, "cart line id", "That item is no longer in your cart.");

  const data = await shopifyFetch<{ cartLinesRemove: CartPayload }>({
    query: CART_LINES_REMOVE_MUTATION,
    variables: { cartId: id, lineIds: [line], country: STORE_COUNTRY },
  });
  return unwrap(data.cartLinesRemove);
}

/** Merges add quantity into an existing line's quantity, capped at MAX_LINE_QUANTITY. */
export function quantityAfterAdd(cart: Cart, merchandiseId: string, adding: number): number {
  const existing = cart.lines.find((l) => l.merchandise.id === merchandiseId)?.quantity ?? 0;
  return existing + adding;
}
