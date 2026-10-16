"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getShopifyEnv } from "@/lib/env";
import {
  addCartLine,
  addQuantitySchema,
  cartLineIdSchema,
  createCart,
  getCart,
  MAX_LINE_QUANTITY,
  quantityAfterAdd,
  removeCartLine,
  updateCartLine,
  updateQuantitySchema,
  variantIdSchema,
} from "@/lib/shopify/cart";
import { clearCartId, readCartId, writeCartId } from "@/lib/shopify/cart-session";
import { checkoutHostsFrom, validateCheckoutUrl } from "@/lib/shopify/checkout";
import { isShopifyError, toPublicMessage } from "@/lib/shopify/errors";
import type { Cart, CartWarning } from "@/lib/shopify/types";

/**
 * Cart Server Actions. These are public HTTP endpoints, so every argument is
 * treated as untrusted and validated. The cart ID is never accepted from the
 * caller; it comes from the HttpOnly cookie only.
 */

export type CartActionResult =
  | { ok: true; cart: Cart | null; warnings: CartWarning[] }
  | { ok: false; error: string };

function logFailure(action: string, error: unknown) {
  // Log the kind and internal message only. No cart contents or customer data.
  const detail = isShopifyError(error) ? `${error.kind}: ${error.message}` : String(error);
  console.error(`[cart] ${action} failed - ${detail}`);
}

function failure(action: string, error: unknown): CartActionResult {
  logFailure(action, error);
  return { ok: false, error: toPublicMessage(error) };
}

const addInput = z.object({
  variantId: variantIdSchema,
  quantity: addQuantitySchema,
});

export async function addToCart(input: unknown): Promise<CartActionResult> {
  const parsed = addInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: `Choose an available option and a quantity between 1 and ${MAX_LINE_QUANTITY}.` };
  }
  const { variantId, quantity } = parsed.data;

  try {
    const cartId = await readCartId();
    const existing = cartId ? await getCart(cartId) : null;

    if (!existing) {
      const result = await createCart([{ merchandiseId: variantId, quantity }]);
      await writeCartId(result.cart.id);
      return { ok: true, ...result };
    }

    if (quantityAfterAdd(existing, variantId, quantity) > MAX_LINE_QUANTITY) {
      return { ok: false, error: `You can have up to ${MAX_LINE_QUANTITY} of this item in your cart.` };
    }

    const result = await addCartLine(existing.id, variantId, quantity);
    return { ok: true, ...result };
  } catch (error) {
    return failure("add", error);
  }
}

const updateInput = z.object({
  lineId: cartLineIdSchema,
  quantity: updateQuantitySchema,
});

/** Loads the cookie's cart and confirms the line belongs to it. */
async function cartContainingLine(lineId: string) {
  const cartId = await readCartId();
  const cart = cartId ? await getCart(cartId) : null;
  if (!cart) {
    await clearCartId();
    return { found: false, error: "Your cart has expired. Please add the item again." } as const;
  }
  if (!cart.lines.some((line) => line.id === lineId)) {
    return { found: false, error: "That item is no longer in your cart." } as const;
  }
  return { found: true, cart } as const;
}

export async function updateCartQuantity(input: unknown): Promise<CartActionResult> {
  const parsed = updateInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: `Choose a quantity between 0 and ${MAX_LINE_QUANTITY}.` };
  }

  try {
    const found = await cartContainingLine(parsed.data.lineId);
    if (!found.found) return { ok: false, error: found.error };

    const result = await updateCartLine(found.cart.id, parsed.data.lineId, parsed.data.quantity);
    return { ok: true, ...result };
  } catch (error) {
    return failure("update", error);
  }
}

const removeInput = z.object({ lineId: cartLineIdSchema });

export async function removeFromCart(input: unknown): Promise<CartActionResult> {
  const parsed = removeInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That item is no longer in your cart." };

  try {
    const found = await cartContainingLine(parsed.data.lineId);
    if (!found.found) return { ok: false, error: found.error };

    const result = await removeCartLine(found.cart.id, parsed.data.lineId);
    return { ok: true, ...result };
  } catch (error) {
    return failure("remove", error);
  }
}

/**
 * Sends the shopper to Shopify-hosted checkout for their cart. Card details
 * are only ever entered on Shopify's checkout, never in this app.
 */
export async function goToCheckout(): Promise<CartActionResult> {
  let checkoutUrl: string;
  try {
    const cartId = await readCartId();
    const cart = cartId ? await getCart(cartId) : null;
    if (!cart || cart.totalQuantity === 0) {
      return { ok: false, error: "Your cart is empty." };
    }

    const env = getShopifyEnv();
    checkoutUrl = validateCheckoutUrl(
      cart.checkoutUrl,
      checkoutHostsFrom(env.storeDomain, process.env.SHOPIFY_CHECKOUT_DOMAINS),
    );
  } catch (error) {
    return failure("checkout", error);
  }

  // redirect() throws to perform the navigation, so it sits outside try/catch.
  redirect(checkoutUrl);
}
