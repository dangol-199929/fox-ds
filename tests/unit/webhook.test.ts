import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyShopifyHmac } from "@/lib/webhooks/verify";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag, cacheLife: vi.fn(), cacheTag: vi.fn() }));

const SECRET = "test-webhook-secret";
const sign = (body: string, secret = SECRET) => createHmac("sha256", secret).update(body).digest("base64");

async function loadRoute() {
  vi.resetModules();
  return import("@/app/api/webhooks/shopify/route");
}

function delivery(body: string, headers: Record<string, string>) {
  return new Request("https://example.com/api/webhooks/shopify", { method: "POST", body, headers });
}

beforeEach(() => {
  vi.stubEnv("SHOPIFY_WEBHOOK_SECRET", SECRET);
  revalidateTag.mockReset();
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("verifyShopifyHmac", () => {
  const body = '{"id":1,"handle":"clean-desk-kit"}';

  it("accepts a correct signature over the raw body", () => {
    expect(verifyShopifyHmac(body, sign(body), SECRET)).toBe(true);
  });

  it.each([
    ["a wrong secret", sign(body, "other-secret")],
    ["a signature of a different body", sign('{"id":2}')],
    ["a missing header", null],
    ["an empty header", ""],
    ["garbage", "not-base64-!!!"],
    ["a truncated signature", sign(body).slice(0, 10)],
  ])("rejects %s", (_label, header) => {
    expect(verifyShopifyHmac(body, header, SECRET)).toBe(false);
  });

  it("rejects when re-serialised JSON differs from the raw body", () => {
    const reserialised = JSON.stringify(JSON.parse(body), null, 2);
    expect(verifyShopifyHmac(reserialised, sign(body), SECRET)).toBe(false);
  });
});

describe("POST /api/webhooks/shopify", () => {
  const body = JSON.stringify({ id: 1, handle: "clean-desk-kit", title: "Clean Desk Kit" });
  const headers = (extra: Record<string, string> = {}) => ({
    "x-shopify-hmac-sha256": sign(body),
    "x-shopify-topic": "products/update",
    "x-shopify-event-id": "evt-1",
    ...extra,
  });

  it("revalidates product caches for a valid product update", async () => {
    const { POST } = await loadRoute();
    const res = await POST(delivery(body, headers()));
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("shopify:products", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("shopify:product:clean-desk-kit", { expire: 0 });
  });

  it("rejects an invalid signature without touching the cache", async () => {
    const { POST } = await loadRoute();
    const res = await POST(delivery(body, headers({ "x-shopify-hmac-sha256": sign(body, "attacker") })));
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("acknowledges a duplicate delivery without processing it again", async () => {
    const { POST } = await loadRoute();
    await POST(delivery(body, headers()));
    revalidateTag.mockClear();

    const res = await POST(delivery(body, headers()));
    expect(await res.json()).toEqual({ ok: true, duplicate: true });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("ignores topics it doesn't handle, such as orders", async () => {
    const { POST } = await loadRoute();
    const orderBody = JSON.stringify({ id: 99, email: "customer@example.com" });
    const res = await POST(
      delivery(orderBody, {
        "x-shopify-hmac-sha256": sign(orderBody),
        "x-shopify-topic": "orders/create",
        "x-shopify-event-id": "evt-order",
      }),
    );
    expect(await res.json()).toEqual({ ok: true, ignored: "topic" });
    expect(revalidateTag).not.toHaveBeenCalled();
    const logged = [...vi.mocked(console.info).mock.calls, ...vi.mocked(console.error).mock.calls].flat().join(" ");
    expect(logged).not.toContain("customer@example.com");
  });

  it("does not trust a malicious handle from the payload", async () => {
    const { POST } = await loadRoute();
    const evil = JSON.stringify({ handle: "../../admin" });
    await POST(
      delivery(evil, {
        "x-shopify-hmac-sha256": sign(evil),
        "x-shopify-topic": "products/update",
        "x-shopify-event-id": "evt-evil",
      }),
    );
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith("shopify:products", { expire: 0 });
  });

  it("refuses deliveries when no secret is configured", async () => {
    vi.stubEnv("SHOPIFY_WEBHOOK_SECRET", "");
    const { POST } = await loadRoute();
    const res = await POST(delivery(body, headers()));
    expect(res.status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
