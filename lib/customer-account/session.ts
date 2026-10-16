import "server-only";
import { cookies } from "next/headers";
import { decodeJwtPayload } from "./pkce";
import { getCustomerAccountConfig, getDiscovery, type CustomerAccountConfig } from "./config";
import { seal, unseal } from "./seal";

/**
 * The signed-in session is a single encrypted, HttpOnly cookie holding
 * Shopify's tokens. Nothing about the customer (name, email, orders) is
 * stored; it's fetched from Shopify on each request and never cached.
 */

export const SESSION_COOKIE = "cdk_session";
export const OAUTH_COOKIE = "cdk_oauth";

export type CustomerSession = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  /** Epoch ms when the access token expires. */
  expiresAt: number;
};

export type PendingLogin = {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
};

const secure = process.env.NODE_ENV === "production";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export async function readSession(config = getCustomerAccountConfig()): Promise<CustomerSession | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return unseal<CustomerSession>(value, config.sessionSecret);
}

/** Route Handlers and Server Actions only. */
export async function writeSession(session: CustomerSession, config = getCustomerAccountConfig()) {
  (await cookies()).set(SESSION_COOKIE, seal(session, config.sessionSecret), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function writePendingLogin(pending: PendingLogin, config = getCustomerAccountConfig()) {
  (await cookies()).set(OAUTH_COOKIE, seal(pending, config.sessionSecret), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/account",
    maxAge: 60 * 10,
  });
}

export async function takePendingLogin(config = getCustomerAccountConfig()): Promise<PendingLogin | null> {
  const store = await cookies();
  const value = store.get(OAUTH_COOKIE)?.value;
  store.delete({ name: OAUTH_COOKIE, path: "/account" });
  return unseal<PendingLogin>(value, config.sessionSecret);
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
};

async function tokenRequest(
  params: Record<string, string>,
  config: CustomerAccountConfig,
): Promise<TokenResponse> {
  const { tokenEndpoint } = await getDiscovery();
  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // Public clients are checked against the JavaScript origins set in Shopify.
      Origin: config.origin,
      "User-Agent": "clean-desk-kit-storefront",
    },
    body: new URLSearchParams({ client_id: config.clientId, ...params }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Token request failed with HTTP ${res.status}`);
  return (await res.json()) as TokenResponse;
}

function toSession(tokens: TokenResponse, previousIdToken = ""): CustomerSession {
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token ?? previousIdToken,
    // Refresh a minute early to avoid using a token as it expires.
    expiresAt: Date.now() + (tokens.expires_in - 60) * 1000,
  };
}

export async function exchangeCode(
  code: string,
  pending: PendingLogin,
  config = getCustomerAccountConfig(),
): Promise<CustomerSession> {
  const tokens = await tokenRequest(
    {
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      code_verifier: pending.verifier,
    },
    config,
  );

  // The ID token comes straight from Shopify's token endpoint over TLS, so
  // per OpenID Connect Core 3.1.3.7 we validate its claims (issuer, audience,
  // expiry and our nonce) rather than its signature.
  const { issuer } = await getDiscovery();
  const claims = tokens.id_token ? decodeJwtPayload(tokens.id_token) : null;
  const audience = claims?.aud;
  const audienceOk = Array.isArray(audience) ? audience.includes(config.clientId) : audience === config.clientId;
  if (
    !claims ||
    claims.iss !== issuer ||
    !audienceOk ||
    claims.nonce !== pending.nonce ||
    typeof claims.exp !== "number" ||
    claims.exp * 1000 < Date.now()
  ) {
    throw new Error("ID token validation failed");
  }

  return toSession(tokens);
}

export async function refreshSession(
  session: CustomerSession,
  config = getCustomerAccountConfig(),
): Promise<CustomerSession> {
  const tokens = await tokenRequest(
    { grant_type: "refresh_token", refresh_token: session.refreshToken },
    config,
  );
  return toSession(tokens, session.idToken);
}

export function isExpired(session: CustomerSession, now = Date.now()): boolean {
  return session.expiresAt <= now;
}
