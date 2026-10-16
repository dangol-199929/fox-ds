import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ShopifyError } from "@/lib/shopify/errors";
import { graphqlOk, requestBody, TEST_ENV } from "../support/shopify-fixtures";

const fetchMock = vi.fn<typeof fetch>();

async function loadClient() {
  vi.resetModules();
  return import("@/lib/shopify/client");
}

beforeEach(() => {
  for (const [key, value] of Object.entries(TEST_ENV)) vi.stubEnv(key, value);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("shopifyFetch", () => {
  it("posts to the versioned Storefront endpoint with the token header", async () => {
    const { shopifyFetch } = await loadClient();
    fetchMock.mockResolvedValueOnce(graphqlOk({ shop: { name: "Test" } }));

    const data = await shopifyFetch<{ shop: { name: string } }>({
      query: "{ shop { name } }",
      variables: { a: 1 },
    });

    expect(data.shop.name).toBe("Test");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://clean-desk-kit-test.myshopify.com/api/2026-10/graphql.json");
    expect((init!.headers as Record<string, string>)["X-Shopify-Storefront-Access-Token"]).toBe(
      TEST_ENV.SHOPIFY_STOREFRONT_PUBLIC_TOKEN,
    );
    expect(init!.cache).toBe("no-store");
    expect(requestBody(fetchMock.mock.calls[0]!).variables).toEqual({ a: 1 });
  });

  it("raises a graphql error for GraphQL-level errors", async () => {
    const { shopifyFetch } = await loadClient();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ errors: [{ message: "Field 'x' doesn't exist" }] }), { status: 200 }),
    );

    await expect(shopifyFetch({ query: "{ x }" })).rejects.toMatchObject({
      kind: "graphql",
      message: expect.stringContaining("Field 'x' doesn't exist"),
    });
  });

  it("does not retry a 401 and hints at the token without revealing it", async () => {
    const { shopifyFetch } = await loadClient();
    fetchMock.mockResolvedValue(new Response("Unauthorized", { status: 401 }));

    const error = await shopifyFetch({ query: "{ shop { name } }", retry: true }).then(
      () => {
        throw new Error("expected shopifyFetch to fail");
      },
      (e: unknown) => e as ShopifyError,
    );

    expect(error).toMatchObject({ kind: "http" });
    expect(error.message).toContain("SHOPIFY_STOREFRONT_PUBLIC_TOKEN");
    expect(error.message).not.toContain(TEST_ENV.SHOPIFY_STOREFRONT_PUBLIC_TOKEN);
    expect(error.publicMessage).not.toMatch(/token/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a query once after a 5xx", async () => {
    const { shopifyFetch } = await loadClient();
    fetchMock
      .mockResolvedValueOnce(new Response("oops", { status: 503 }))
      .mockResolvedValueOnce(graphqlOk({ ok: true }));

    await expect(shopifyFetch({ query: "{ ok }", retry: true })).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries a query once after a network failure, then gives up", async () => {
    const { shopifyFetch } = await loadClient();
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(shopifyFetch({ query: "{ ok }", retry: true })).rejects.toMatchObject({
      kind: "network",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("never retries a mutation, so a cart change is not applied twice", async () => {
    const { shopifyFetch } = await loadClient();
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(shopifyFetch({ query: "mutation { x }" })).rejects.toMatchObject({
      kind: "network",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports a timeout distinctly", async () => {
    const { shopifyFetch } = await loadClient();
    fetchMock.mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"));

    await expect(shopifyFetch({ query: "{ ok }", timeoutMs: 50 })).rejects.toMatchObject({
      kind: "timeout",
    });
  });

  it("fails with a config error, without calling Shopify, when env is missing", async () => {
    vi.stubEnv("SHOPIFY_STOREFRONT_PUBLIC_TOKEN", "");
    const { shopifyFetch } = await loadClient();

    await expect(shopifyFetch({ query: "{ ok }" })).rejects.toMatchObject({
      kind: "config",
      message: expect.stringContaining("SHOPIFY_STOREFRONT_PUBLIC_TOKEN is required"),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
