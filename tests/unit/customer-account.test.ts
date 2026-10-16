import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { codeChallenge, decodeJwtPayload, randomToken, safeReturnTo } from "@/lib/customer-account/pkce";
import { seal, unseal } from "@/lib/customer-account/seal";
import { TEST_ENV } from "../support/shopify-fixtures";

const SECRET = "x".repeat(40);

// In-memory cookie jar standing in for next/headers.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (arg: string | { name: string }) => void jar.delete(typeof arg === "string" ? arg : arg.name),
  }),
}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), revalidateTag: vi.fn() }));

const ISSUER = "https://shopify.com/authentication/1";
const fetchMock = vi.fn<typeof fetch>();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const jwt = (claims: Record<string, unknown>) =>
  ["e30", Buffer.from(JSON.stringify(claims)).toString("base64url"), "sig"].join(".");

function mockShopify(idClaims: Record<string, unknown>) {
  fetchMock.mockImplementation(async (url) => {
    const u = String(url);
    if (u.endsWith("/.well-known/openid-configuration")) {
      return json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/oauth/authorize`,
        token_endpoint: `${ISSUER}/oauth/token`,
        end_session_endpoint: `${ISSUER}/logout`,
      });
    }
    if (u.endsWith("/.well-known/customer-account-api")) return json({ graphql_api: "https://shopify.com/1/account/customer/api/2026-10/graphql" });
    if (u.endsWith("/oauth/token")) {
      return json({ access_token: "shcat_test", refresh_token: "shcrt_test", id_token: jwt(idClaims), expires_in: 3600 });
    }
    throw new Error(`unexpected ${u}`);
  });
}

beforeEach(() => {
  for (const [key, value] of Object.entries(TEST_ENV)) vi.stubEnv(key, value);
  vi.stubEnv("SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID", "test-client-id");
  vi.stubEnv("SESSION_SECRET", SECRET);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://shop.example.com.au");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  jar.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => vi.unstubAllGlobals());

describe("sealed cookies", () => {
  it("round-trips a value", () => {
    expect(unseal(seal({ a: 1 }, SECRET), SECRET)).toEqual({ a: 1 });
  });

  it("rejects tampering, a different key, and junk", () => {
    const sealed = seal({ accessToken: "t" }, SECRET);
    const [iv, tag, body] = sealed.split(".");
    const flipped = Buffer.from(body!, "base64url");
    flipped[0] = flipped[0]! ^ 1;
    expect(unseal(`${iv}.${tag}.${flipped.toString("base64url")}`, SECRET)).toBeNull();
    expect(unseal(sealed, "y".repeat(40))).toBeNull();
    expect(unseal("not.a.cookie", SECRET)).toBeNull();
    expect(unseal(undefined, SECRET)).toBeNull();
  });

  it("does not expose the token in the cookie value", () => {
    expect(seal({ accessToken: "shcat_secret_value" }, SECRET)).not.toContain("shcat_secret_value");
  });

  it("refuses a short secret", () => {
    expect(() => seal({}, "short")).toThrow(/32 characters/);
  });
});

describe("PKCE and redirects", () => {
  it("builds an S256 code challenge", () => {
    const verifier = randomToken(48);
    expect(codeChallenge(verifier)).toBe(createHash("sha256").update(verifier).digest("base64url"));
    expect(codeChallenge(verifier)).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it.each([
    ["/account/orders/1", "/account/orders/1"],
    ["/shop?sort=price-asc", "/shop?sort=price-asc"],
    ["https://evil.example/", "/account"],
    ["//evil.example/", "/account"],
    ["/\\evil.example", "/account"],
    ["javascript:alert(1)", "/account"],
    [null, "/account"],
  ])("safeReturnTo(%j) is %j", (input, expected) => {
    expect(safeReturnTo(input)).toBe(expected);
  });

  it("decodes JWT claims", () => {
    expect(decodeJwtPayload(jwt({ nonce: "n" }))).toEqual({ nonce: "n" });
    expect(decodeJwtPayload("garbage")).toBeNull();
  });
});

describe("sign-in flow", () => {
  it("login redirects to Shopify with PKCE, state and nonce, and remembers them in a sealed cookie", async () => {
    mockShopify({});
    const { GET } = await import("@/app/account/login/route");
    const { NextRequest } = await import("next/server");

    const res = await GET(new NextRequest("https://shop.example.com.au/account/login?returnTo=%2Faccount%2Fprofile"));
    const location = new URL(res.headers.get("location")!);

    expect(location.origin + location.pathname).toBe(`${ISSUER}/oauth/authorize`);
    expect(location.searchParams.get("client_id")).toBe("test-client-id");
    expect(location.searchParams.get("redirect_uri")).toBe("https://shop.example.com.au/account/callback");
    expect(location.searchParams.get("code_challenge_method")).toBe("S256");
    expect(location.searchParams.get("scope")).toBe("openid email customer-account-api:full");

    const pending = unseal<{ state: string; nonce: string; returnTo: string }>(jar.get("cdk_oauth"), SECRET)!;
    expect(location.searchParams.get("state")).toBe(pending.state);
    expect(location.searchParams.get("nonce")).toBe(pending.nonce);
    expect(pending.returnTo).toBe("/account/profile");
  });

  async function callback(query: string) {
    const { GET } = await import("@/app/account/callback/route");
    const { NextRequest } = await import("next/server");
    return GET(new NextRequest(`https://shop.example.com.au/account/callback?${query}`));
  }

  function pendingCookie(over: Partial<{ state: string; nonce: string }> = {}) {
    jar.set(
      "cdk_oauth",
      seal({ state: "s1", nonce: "n1", verifier: "v".repeat(64), returnTo: "/account", ...over }, SECRET),
    );
  }

  it("signs in on a valid callback and stores an encrypted session", async () => {
    mockShopify({ iss: ISSUER, aud: "test-client-id", nonce: "n1", exp: Math.floor(Date.now() / 1000) + 600 });
    pendingCookie();

    const res = await callback("code=abc&state=s1");

    expect(new URL(res.headers.get("location")!).pathname).toBe("/account");
    const session = unseal<{ accessToken: string }>(jar.get("cdk_session"), SECRET);
    expect(session?.accessToken).toBe("shcat_test");
    expect(jar.has("cdk_oauth")).toBe(false);
  });

  it("rejects a callback whose state doesn't match (CSRF)", async () => {
    mockShopify({});
    pendingCookie();
    const res = await callback("code=abc&state=attacker");
    expect(res.headers.get("location")).toContain("error=expired");
    expect(jar.has("cdk_session")).toBe(false);
  });

  it("rejects an ID token with the wrong nonce", async () => {
    mockShopify({ iss: ISSUER, aud: "test-client-id", nonce: "other", exp: Math.floor(Date.now() / 1000) + 600 });
    pendingCookie();
    const res = await callback("code=abc&state=s1");
    expect(res.headers.get("location")).toContain("error=signin");
    expect(jar.has("cdk_session")).toBe(false);
  });

  it("rejects an ID token for another app", async () => {
    mockShopify({ iss: ISSUER, aud: "someone-else", nonce: "n1", exp: Math.floor(Date.now() / 1000) + 600 });
    pendingCookie();
    const res = await callback("code=abc&state=s1");
    expect(res.headers.get("location")).toContain("error=signin");
  });

  it("handles the customer cancelling on Shopify's page", async () => {
    mockShopify({});
    pendingCookie();
    const res = await callback("error=access_denied&state=s1");
    expect(res.headers.get("location")).toContain("error=cancelled");
  });

  it("sign-out clears the session and ends the Shopify session", async () => {
    mockShopify({});
    jar.set("cdk_session", seal({ accessToken: "a", refreshToken: "r", idToken: "id-token", expiresAt: Date.now() + 1e6 }, SECRET));
    const { POST } = await import("@/app/account/logout/route");
    const { NextRequest } = await import("next/server");

    const res = await POST(new NextRequest("https://shop.example.com.au/account/logout", { method: "POST" }));
    const location = new URL(res.headers.get("location")!);

    expect(res.status).toBe(303);
    expect(location.pathname).toBe("/authentication/1/logout");
    expect(location.searchParams.get("id_token_hint")).toBe("id-token");
    expect(location.searchParams.get("post_logout_redirect_uri")).toBe("https://shop.example.com.au/");
    expect(jar.has("cdk_session")).toBe(false);
  });
});
