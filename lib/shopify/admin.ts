import "server-only";
import { getShopifyEnv } from "@/lib/env";
import { graphqlError, httpError, networkError, ShopifyError, timeoutError } from "./errors";

/**
 * Shopify Admin API access for server-only tasks (currently newsletter
 * consent). Uses the client credentials grant for apps created in the Shopify
 * Dev Dashboard: the client ID and secret are exchanged for an access token
 * that lasts 24 hours, cached here and refreshed before it expires.
 *
 * The client secret and access token never leave the server and are never
 * logged.
 */

const TIMEOUT_MS = 10_000;
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

type CachedToken = { token: string; expiresAt: number };
let cached: CachedToken | null = null;
let inflight: Promise<string> | null = null;

export function isAdminConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.SHOPIFY_ADMIN_CLIENT_ID?.trim() && env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim());
}

function adminConfigError() {
  return new ShopifyError(
    "Shopify Admin API is not configured: set SHOPIFY_ADMIN_CLIENT_ID and SHOPIFY_ADMIN_CLIENT_SECRET",
    "config",
    "Sign-ups aren't available right now. Please try again later.",
  );
}

async function post(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") throw timeoutError(TIMEOUT_MS);
    throw networkError(error);
  }
}

async function requestToken(storeDomain: string): Promise<string> {
  const response = await post(`https://${storeDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SHOPIFY_ADMIN_CLIENT_ID!.trim(),
      client_secret: process.env.SHOPIFY_ADMIN_CLIENT_SECRET!.trim(),
    }),
  });
  if (!response.ok) {
    throw new ShopifyError(
      `Admin token request failed with HTTP ${response.status} (check the app is installed on the store and the client ID/secret are correct)`,
      "http",
      "Sign-ups aren't available right now. Please try again later.",
    );
  }
  const body = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw graphqlError(["token response had no access_token"]);

  cached = {
    token: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 86_399) * 1000,
  };
  return body.access_token;
}

async function getAccessToken(storeDomain: string): Promise<string> {
  if (cached && cached.expiresAt - REFRESH_MARGIN_MS > Date.now()) return cached.token;
  // Share one refresh between concurrent requests.
  inflight ??= requestToken(storeDomain).finally(() => {
    inflight = null;
  });
  return inflight;
}

/** For tests: forget the cached token. */
export function resetAdminTokenCache() {
  cached = null;
  inflight = null;
}

export async function adminFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!isAdminConfigured()) throw adminConfigError();
  const env = getShopifyEnv();
  const token = await getAccessToken(env.storeDomain);

  const response = await post(`https://${env.storeDomain}/admin/api/${env.apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 401) resetAdminTokenCache();
  if (!response.ok) throw httpError(response.status);

  const json = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw graphqlError(json.errors.map((e) => e.message));
  if (!json.data) throw graphqlError(["response contained no data"]);
  return json.data;
}
