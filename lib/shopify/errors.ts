/**
 * Error types for Shopify Storefront API calls.
 *
 * Messages are written for logs and never include tokens. `publicMessage` is
 * safe to show to shoppers; everything else stays on the server.
 */

export type ShopifyErrorKind =
  | "config"
  | "network"
  | "timeout"
  | "http"
  | "graphql"
  | "user"
  | "invalid_input"
  | "not_found"
  | "invalid_checkout_url";

export class ShopifyError extends Error {
  constructor(
    message: string,
    public readonly kind: ShopifyErrorKind,
    public readonly publicMessage: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "ShopifyError";
  }
}

const GENERIC = "Something went wrong talking to the store. Please try again.";

export function networkError(cause: unknown) {
  return new ShopifyError(
    "Network error reaching the Shopify Storefront API",
    "network",
    "We couldn't reach the store. Check your connection and try again.",
    { cause },
  );
}

export function timeoutError(ms: number) {
  return new ShopifyError(
    `Shopify Storefront API did not respond within ${ms}ms`,
    "timeout",
    "The store is taking too long to respond. Please try again.",
  );
}

export function httpError(status: number) {
  // 401/403 almost always mean a bad or revoked token, or a missing permission.
  const hint =
    status === 401 || status === 403
      ? " (check SHOPIFY_STOREFRONT_PUBLIC_TOKEN and Storefront API permissions)"
      : "";
  return new ShopifyError(
    `Shopify Storefront API responded with HTTP ${status}${hint}`,
    "http",
    GENERIC,
  );
}

export function graphqlError(messages: string[]) {
  return new ShopifyError(
    `Shopify GraphQL error: ${messages.join("; ")}`,
    "graphql",
    GENERIC,
  );
}

export type ShopifyUserError = {
  code?: string | null;
  field?: string[] | null;
  message: string;
};

/** Shopify rejected a cart mutation (for example, an unavailable variant). */
export function userError(errors: ShopifyUserError[]) {
  const codes = errors.map((e) => e.code ?? "UNKNOWN").join(", ");
  return new ShopifyError(
    `Shopify rejected the cart change: ${codes}`,
    "user",
    errors[0]?.message || "That change couldn't be made to your cart.",
  );
}

export function invalidInput(detail: string, publicMessage: string) {
  return new ShopifyError(`Invalid input: ${detail}`, "invalid_input", publicMessage);
}

export function notFound(what: string, publicMessage: string) {
  return new ShopifyError(`${what} not found`, "not_found", publicMessage);
}

export function isShopifyError(error: unknown): error is ShopifyError {
  return error instanceof ShopifyError;
}

/** Safe message for the shopper, whatever was thrown. */
export function toPublicMessage(error: unknown): string {
  return isShopifyError(error) ? error.publicMessage : GENERIC;
}
