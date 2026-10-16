import { revalidateTag } from "next/cache";
import { getWebhookSecret } from "@/lib/env";
import { COLLECTIONS_TAG, isValidHandle, productTag, PRODUCTS_TAG } from "@/lib/shopify/products";
import { SHOP_TAG } from "@/lib/shopify/shop";
import { createDeliveryLog } from "@/lib/webhooks/dedupe";
import { verifyShopifyHmac } from "@/lib/webhooks/verify";

/**
 * Shopify webhook receiver.
 *
 * Its only job is keeping cached storefront data fresh when products,
 * inventory, collections or policies change in Shopify. Orders, fulfilment and
 * tracking are handled by Shopify and the supplier app (DSers or
 * CJdropshipping), so no order webhooks are processed here, and nothing in
 * this endpoint is ever treated as proof that an order was fulfilled.
 */

const deliveries = createDeliveryLog();

const PRODUCT_TOPICS = new Set(["products/create", "products/update", "products/delete"]);
const INVENTORY_TOPICS = new Set(["inventory_levels/update", "inventory_levels/connect", "inventory_levels/disconnect"]);
const COLLECTION_TOPICS = new Set(["collections/create", "collections/update", "collections/delete"]);
const SHOP_TOPICS = new Set(["shop/update"]);

// Expire immediately: a changed price or stock level should never be served stale.
const NOW = { expire: 0 };

export async function POST(request: Request): Promise<Response> {
  let secret: string;
  try {
    secret = getWebhookSecret();
  } catch {
    console.error("[webhook] SHOPIFY_WEBHOOK_SECRET is not set; rejecting delivery");
    return new Response("Webhook receiver not configured", { status: 503 });
  }

  // Verify against the exact raw body before parsing anything.
  const rawBody = await request.text();
  if (!verifyShopifyHmac(rawBody, request.headers.get("x-shopify-hmac-sha256"), secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic") ?? "";
  const deliveryId =
    request.headers.get("x-shopify-event-id") ?? request.headers.get("x-shopify-webhook-id") ?? "";

  if (deliveryId && !deliveries.firstDelivery(deliveryId)) {
    return Response.json({ ok: true, duplicate: true });
  }

  let payload: { handle?: unknown } = {};
  try {
    payload = JSON.parse(rawBody) as { handle?: unknown };
  } catch {
    // Signed but not JSON: acknowledge so Shopify doesn't retry forever.
    return Response.json({ ok: true, ignored: "unparseable" });
  }

  if (PRODUCT_TOPICS.has(topic)) {
    revalidateTag(PRODUCTS_TAG, NOW);
    if (typeof payload.handle === "string" && isValidHandle(payload.handle)) {
      revalidateTag(productTag(payload.handle), NOW);
    }
  } else if (INVENTORY_TOPICS.has(topic)) {
    // Inventory payloads identify an inventory item, not a product handle.
    revalidateTag(PRODUCTS_TAG, NOW);
  } else if (COLLECTION_TOPICS.has(topic)) {
    revalidateTag(COLLECTIONS_TAG, NOW);
    revalidateTag(PRODUCTS_TAG, NOW);
  } else if (SHOP_TOPICS.has(topic)) {
    revalidateTag(SHOP_TAG, NOW);
  } else {
    return Response.json({ ok: true, ignored: "topic" });
  }

  // Topic only: product webhooks hold no customer data, and nothing else is logged.
  console.info(`[webhook] revalidated cache for ${topic}`);
  return Response.json({ ok: true });
}
