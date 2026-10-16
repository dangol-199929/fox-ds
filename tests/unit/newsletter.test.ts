import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_ENV } from "../support/shopify-fixtures";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": currentIp }),
}));

let currentIp = "203.0.113.1";
const fetchMock = vi.fn<typeof fetch>();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function load() {
  vi.resetModules();
  const action = await import("@/app/actions/newsletter");
  const admin = await import("@/lib/shopify/admin");
  admin.resetAdminTokenCache();
  return action;
}

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

const idle = { status: "idle" } as const;
const ok = { email: "person@example.com", consent: "yes" };

/** Routes mocked Shopify calls by URL and GraphQL operation. */
function shopify(handlers: { lookup?: unknown; create?: unknown; update?: unknown; token?: Response }) {
  fetchMock.mockImplementation(async (url, init) => {
    const u = String(url);
    if (u.endsWith("/admin/oauth/access_token")) {
      return handlers.token ?? json({ access_token: "test-admin-token", expires_in: 86399, scope: "write_customers" });
    }
    const { query } = JSON.parse(init!.body as string) as { query: string };
    if (query.includes("customerByIdentifier")) return json({ data: { customerByIdentifier: handlers.lookup ?? null } });
    if (query.includes("customerCreate")) return json({ data: { customerCreate: handlers.create ?? { customer: { id: "gid://shopify/Customer/1" }, userErrors: [] } } });
    if (query.includes("customerEmailMarketingConsentUpdate")) {
      return json({ data: { customerEmailMarketingConsentUpdate: handlers.update ?? { customer: { id: "gid://shopify/Customer/1" }, userErrors: [] } } });
    }
    throw new Error(`unexpected request ${u}`);
  });
}

function gqlCalls() {
  return fetchMock.mock.calls
    .filter(([url]) => String(url).includes("/graphql.json"))
    .map(([, init]) => JSON.parse(init!.body as string) as { query: string; variables: { input: { [key: string]: unknown; customerId?: string; emailMarketingConsent: { consentUpdatedAt: string } } } });
}

beforeEach(() => {
  for (const [key, value] of Object.entries(TEST_ENV)) vi.stubEnv(key, value);
  vi.stubEnv("SHOPIFY_ADMIN_CLIENT_ID", "test-client-id");
  vi.stubEnv("SHOPIFY_ADMIN_CLIENT_SECRET", "test-client-secret");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
  currentIp = `203.0.113.${Math.floor(Math.random() * 250)}`;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("subscribeToNewsletter", () => {
  it("creates a new customer with explicit, timestamped email consent", async () => {
    const { subscribeToNewsletter } = await load();
    shopify({});

    const state = await subscribeToNewsletter(idle, form({ ...ok, email: "  Person@Example.com " }));

    expect(state.status).toBe("success");
    const create = gqlCalls().find((c) => c.query.includes("customerCreate"))!;
    expect(create.variables.input).toMatchObject({
      email: "person@example.com",
      tags: ["newsletter"],
      emailMarketingConsent: { marketingState: "SUBSCRIBED", marketingOptInLevel: "SINGLE_OPT_IN" },
    });
    expect(create.variables.input.emailMarketingConsent.consentUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("uses the client credentials grant and the Admin API token header", async () => {
    const { subscribeToNewsletter } = await load();
    shopify({});
    await subscribeToNewsletter(idle, form(ok));

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0]!;
    expect(String(tokenUrl)).toBe("https://clean-desk-kit-test.myshopify.com/admin/oauth/access_token");
    expect(String(tokenInit!.body)).toContain("grant_type=client_credentials");
    const [, gqlInit] = fetchMock.mock.calls[1]!;
    expect((gqlInit!.headers as Record<string, string>)["X-Shopify-Access-Token"]).toBe("test-admin-token");
  });

  it("subscribes an existing customer who wasn't subscribed, without creating a duplicate", async () => {
    const { subscribeToNewsletter } = await load();
    shopify({ lookup: { id: "gid://shopify/Customer/9", emailMarketingConsent: { marketingState: "NOT_SUBSCRIBED" } } });

    const state = await subscribeToNewsletter(idle, form(ok));

    expect(state.status).toBe("success");
    const calls = gqlCalls();
    expect(calls.some((c) => c.query.includes("customerCreate"))).toBe(false);
    expect(calls.find((c) => c.query.includes("ConsentUpdate"))!.variables.input.customerId).toBe("gid://shopify/Customer/9");
  });

  it("treats a duplicate subscription as success without changing anything", async () => {
    const { subscribeToNewsletter } = await load();
    shopify({ lookup: { id: "gid://shopify/Customer/9", emailMarketingConsent: { marketingState: "SUBSCRIBED" } } });

    const state = await subscribeToNewsletter(idle, form(ok));

    expect(state).toEqual({ status: "success", message: expect.stringContaining("on the list") });
    expect(gqlCalls()).toHaveLength(1);
  });

  it("gives new and existing subscribers the same message, so the list can't be probed", async () => {
    let { subscribeToNewsletter } = await load();
    shopify({});
    const fresh = await subscribeToNewsletter(idle, form(ok));
    ({ subscribeToNewsletter } = await load());
    shopify({ lookup: { id: "gid://shopify/Customer/9", emailMarketingConsent: { marketingState: "SUBSCRIBED" } } });
    const repeat = await subscribeToNewsletter(idle, form(ok));
    expect(repeat).toEqual(fresh);
  });

  it.each(["", "not-an-email", "a@b", "x".repeat(250) + "@example.com"])(
    "rejects invalid email %j without calling Shopify",
    async (email) => {
      const { subscribeToNewsletter } = await load();
      const state = await subscribeToNewsletter(idle, form({ email, consent: "yes" }));
      expect(state).toMatchObject({ status: "error", field: "email" });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("requires the consent box to be ticked", async () => {
    const { subscribeToNewsletter } = await load();
    const state = await subscribeToNewsletter(idle, form({ email: "person@example.com" }));
    expect(state).toMatchObject({ status: "error", field: "consent" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("silently drops bot submissions that fill the honeypot", async () => {
    const { subscribeToNewsletter } = await load();
    const state = await subscribeToNewsletter(idle, form({ ...ok, company: "Spam Pty Ltd" }));
    expect(state.status).toBe("success");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rate limits repeated submissions from one client", async () => {
    const { subscribeToNewsletter } = await load();
    shopify({});
    const results = [];
    for (let i = 0; i < 6; i++) results.push(await subscribeToNewsletter(idle, form(ok)));
    expect(results.slice(0, 5).every((r) => r.status === "success")).toBe(true);
    expect(results[5]).toMatchObject({ status: "error", message: expect.stringContaining("Too many attempts") });
  });

  it("shows a safe error and logs no email address when Shopify fails", async () => {
    const { subscribeToNewsletter } = await load();
    shopify({ create: { customer: null, userErrors: [{ field: ["email"], message: "person@example.com is invalid" }] } });

    const state = await subscribeToNewsletter(idle, form(ok));

    expect(state).toMatchObject({ status: "error", message: expect.not.stringContaining("person@example.com") });
    const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(logged).not.toContain("person@example.com");
  });

  it("explains sign-ups are unavailable, without calling Shopify, when the app isn't configured", async () => {
    vi.stubEnv("SHOPIFY_ADMIN_CLIENT_SECRET", "");
    const { subscribeToNewsletter } = await load();
    const state = await subscribeToNewsletter(idle, form(ok));
    expect(state).toMatchObject({ status: "error", message: "Sign-ups aren't available right now. Please try again later." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a failed token exchange safely", async () => {
    const { subscribeToNewsletter } = await load();
    shopify({ token: json({ error: "shop_not_permitted" }, 400) });
    const state = await subscribeToNewsletter(idle, form(ok));
    expect(state.status).toBe("error");
    expect(JSON.stringify(state)).not.toContain("test-client-secret");
  });
});
