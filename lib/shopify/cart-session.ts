import "server-only";
import { cookies } from "next/headers";
import { isValidCartId } from "./cart";

/**
 * The cart ID lives only in an HttpOnly cookie that browser JavaScript can't
 * read or forge into a request body. It holds nothing but Shopify's cart ID,
 * no personal details.
 */
export const CART_COOKIE = "cdk_cart";

// Shopify carts expire after 10 days without changes; match that.
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 10;

export async function readCartId(): Promise<string | null> {
  const value = (await cookies()).get(CART_COOKIE)?.value;
  return value && isValidCartId(value) ? value : null;
}

/** Only callable from a Server Action or Route Handler. */
export async function writeCartId(cartId: string): Promise<void> {
  if (!isValidCartId(cartId)) return;
  (await cookies()).set(CART_COOKIE, cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

/** Only callable from a Server Action or Route Handler. */
export async function clearCartId(): Promise<void> {
  (await cookies()).delete(CART_COOKIE);
}
