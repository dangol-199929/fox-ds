import "server-only";
import { z } from "zod";

/**
 * Server-side environment validation.
 *
 * Values are read lazily (on first use) rather than at import time, so a
 * missing variable produces a clear error where Shopify is actually called
 * instead of breaking unrelated pages or tooling.
 *
 * Error messages name the variable and the rule it broke, never its value.
 */

const MYSHOPIFY_DOMAIN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;
// Stable Shopify API versions are quarterly: YYYY-01, -04, -07 or -10.
const API_VERSION = /^\d{4}-(01|04|07|10)$/;

const shopifyEnvSchema = z.object({
  SHOPIFY_STORE_DOMAIN: z
    .string({ error: "is required" })
    .trim()
    .toLowerCase()
    .regex(MYSHOPIFY_DOMAIN, {
      error: "must be your store's *.myshopify.com domain, without https://",
    }),
  SHOPIFY_STOREFRONT_API_VERSION: z
    .string({ error: "is required" })
    .trim()
    .regex(API_VERSION, {
      error: "must be a stable Shopify API version such as 2026-10",
    }),
  SHOPIFY_STOREFRONT_PUBLIC_TOKEN: z
    .string({ error: "is required" })
    .trim()
    .min(1, { error: "is required" })
    .regex(/^\S+$/, { error: "must not contain whitespace" }),
});

export type ShopifyEnv = {
  storeDomain: string;
  apiVersion: string;
  storefrontToken: string;
  storefrontEndpoint: string;
};

export class EnvValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid environment configuration:\n- ${issues.join("\n- ")}`);
    this.name = "EnvValidationError";
  }
}

type RawEnv = Record<string, string | undefined>;

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const name = issue.path.join(".") || "environment";
    return `${name} ${issue.message}`;
  });
}

/** Validates Shopify settings from the given source. Exported for tests. */
export function parseShopifyEnv(source: RawEnv): ShopifyEnv {
  const result = shopifyEnvSchema.safeParse({
    SHOPIFY_STORE_DOMAIN: source.SHOPIFY_STORE_DOMAIN || undefined,
    SHOPIFY_STOREFRONT_API_VERSION:
      source.SHOPIFY_STOREFRONT_API_VERSION || undefined,
    SHOPIFY_STOREFRONT_PUBLIC_TOKEN:
      source.SHOPIFY_STOREFRONT_PUBLIC_TOKEN || undefined,
  });

  if (!result.success) {
    throw new EnvValidationError(formatIssues(result.error));
  }

  const env = result.data;
  return {
    storeDomain: env.SHOPIFY_STORE_DOMAIN,
    apiVersion: env.SHOPIFY_STOREFRONT_API_VERSION,
    storefrontToken: env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN,
    storefrontEndpoint: `https://${env.SHOPIFY_STORE_DOMAIN}/api/${env.SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`,
  };
}

let cachedShopifyEnv: ShopifyEnv | undefined;

/** Validated Shopify settings for server code. Throws EnvValidationError. */
export function getShopifyEnv(): ShopifyEnv {
  cachedShopifyEnv ??= parseShopifyEnv(process.env);
  return cachedShopifyEnv;
}

/** Validates the webhook signing secret. Exported for tests. */
export function parseWebhookSecret(source: RawEnv): string {
  const secret = source.SHOPIFY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new EnvValidationError(["SHOPIFY_WEBHOOK_SECRET is required"]);
  }
  return secret;
}

export function getWebhookSecret(): string {
  return parseWebhookSecret(process.env);
}

/**
 * Public site URL, used for canonical links and the sitemap. Must be an
 * absolute http(s) URL, and https outside local development.
 */
export function parseSiteUrl(source: RawEnv): URL {
  const raw = source.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    throw new EnvValidationError(["NEXT_PUBLIC_SITE_URL is required"]);
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new EnvValidationError([
      "NEXT_PUBLIC_SITE_URL must be an absolute URL such as https://example.com.au",
    ]);
  }

  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) {
    throw new EnvValidationError([
      "NEXT_PUBLIC_SITE_URL must use https (http is only allowed for localhost)",
    ]);
  }

  return url;
}

export function getSiteUrl(): URL {
  return parseSiteUrl({
    // Referenced directly so Next.js can inline the public value.
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
}
