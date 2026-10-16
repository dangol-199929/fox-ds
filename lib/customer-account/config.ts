import "server-only";
import { cacheLife } from "next/cache";
import { getShopifyEnv } from "@/lib/env";
import { siteUrl } from "@/lib/site-url";

/**
 * Shopify Customer Account API (new customer accounts), used with a *public*
 * client from the Headless channel: OAuth 2.0 authorization code flow with
 * PKCE. Customers sign in on Shopify's page with a one-time email code, so
 * this app never sees or stores passwords.
 */

export const SCOPES = "openid email customer-account-api:full";

export type CustomerAccountConfig = {
  clientId: string;
  sessionSecret: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  origin: string;
};

export function isCustomerAccountConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?.trim() && (env.SESSION_SECRET?.length ?? 0) >= 32);
}

export function getCustomerAccountConfig(): CustomerAccountConfig {
  if (!isCustomerAccountConfigured()) {
    throw new Error(
      "Customer accounts are not configured: set SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID and SESSION_SECRET (32+ characters)",
    );
  }
  const base = siteUrl();
  return {
    clientId: process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID!.trim(),
    sessionSecret: process.env.SESSION_SECRET!,
    redirectUri: new URL("/account/callback", base).toString(),
    postLogoutRedirectUri: new URL("/", base).toString(),
    origin: base.origin,
  };
}

export type Discovery = {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  endSessionEndpoint: string;
  issuer: string;
  graphqlEndpoint: string;
};

/** Shopify publishes its endpoints per store; cached for a day. */
export async function getDiscovery(): Promise<Discovery> {
  "use cache";
  cacheLife("days");

  const { storeDomain } = getShopifyEnv();
  const get = async (path: string) => {
    const res = await fetch(`https://${storeDomain}${path}`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Discovery ${path} failed with HTTP ${res.status}`);
    return res.json() as Promise<Record<string, string>>;
  };
  const [oidc, api] = await Promise.all([
    get("/.well-known/openid-configuration"),
    get("/.well-known/customer-account-api"),
  ]);
  return {
    authorizationEndpoint: oidc.authorization_endpoint!,
    tokenEndpoint: oidc.token_endpoint!,
    endSessionEndpoint: oidc.end_session_endpoint!,
    issuer: oidc.issuer!,
    graphqlEndpoint: api.graphql_api!,
  };
}
