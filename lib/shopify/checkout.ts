import { ShopifyError } from "./errors";

/**
 * Checks that a checkout URL returned by Shopify is safe to redirect a
 * shopper to: https, no credentials or custom port, and on the store's own
 * domain or an explicitly configured checkout domain.
 *
 * This stops a tampered or unexpected value from turning the checkout
 * button into an open redirect.
 */
export function validateCheckoutUrl(
  raw: string,
  allowedHosts: readonly string[],
): string {
  const fail = (reason: string) =>
    new ShopifyError(
      `Rejected checkout URL: ${reason}`,
      "invalid_checkout_url",
      "Checkout isn't available right now. Please try again shortly.",
    );

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw fail("not an absolute URL");
  }

  if (url.protocol !== "https:") throw fail("not https");
  if (url.username || url.password) throw fail("contains credentials");
  if (url.port) throw fail("non-default port");

  const host = url.hostname.toLowerCase();
  const allowed = allowedHosts.map((h) => h.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(host)) throw fail(`host ${host} is not an allowed checkout domain`);

  return url.toString();
}

/**
 * Hosts allowed for checkout: the *.myshopify.com domain plus any extra
 * domains in SHOPIFY_CHECKOUT_DOMAINS (comma-separated), for when a custom
 * domain such as checkout.example.com.au is connected in Shopify.
 */
export function checkoutHostsFrom(storeDomain: string, extra: string | undefined): string[] {
  const extras = (extra ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter((h) => /^[a-z0-9.-]+$/.test(h));
  return [storeDomain.toLowerCase(), ...extras];
}
