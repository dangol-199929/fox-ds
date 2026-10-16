import "server-only";
import { getCart } from "./cart";
import { readCartId } from "./cart-session";
import type { Cart } from "./types";

/**
 * The visitor's cart for rendering. Reads the cookie, so call it inside a
 * <Suspense> boundary. Returns null when there is no cart or Shopify has
 * expired it. (The stale cookie is replaced on the next cart change, since
 * cookies can't be cleared during rendering.)
 */
export async function getCurrentCart(): Promise<Cart | null> {
  const cartId = await readCartId();
  if (!cartId) return null;
  return getCart(cartId);
}
