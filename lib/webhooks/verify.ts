import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies Shopify's X-Shopify-Hmac-Sha256 header: a base64 HMAC-SHA256 of
 * the exact raw request body, keyed with the webhook signing secret.
 * Must be given the raw body, before any JSON parsing.
 */
export function verifyShopifyHmac(rawBody: string | Buffer, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader || !secret) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest();
  let received: Buffer;
  try {
    received = Buffer.from(hmacHeader, "base64");
  } catch {
    return false;
  }
  // timingSafeEqual throws on length mismatch; compare lengths first.
  return received.length === expected.length && timingSafeEqual(received, expected);
}
