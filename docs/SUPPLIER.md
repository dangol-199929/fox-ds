# Supplier fulfilment guide (DSers or CJdropshipping)

Orders are fulfilled through a Shopify dropshipping app, not custom code. The
storefront only creates Shopify carts; Shopify creates the order; the supplier
app reads the order from Shopify, and (once you approve it) places the
supplier order and writes tracking back to Shopify.

> Feature and pricing details below were checked on 16 October 2026 from the
> apps' Shopify App Store listings and public reviews. Apps change often:
> confirm each capability inside the app before relying on it.
> Sources: [DSers on the Shopify App Store](https://apps.shopify.com/dsers),
> [CJdropshipping app guide](https://sleeknote.com/advanced/how-to/how-to-connect-cj-dropshipping-to-shopify-a-step-by-step-guide).

## 1. Choose a supplier app

| | DSers (AliExpress) | CJdropshipping |
|---|---|---|
| App cost | Basic plan free; Advanced about US$19.90/month | App free; you pay per order |
| Supplier catalogue | AliExpress sellers | CJ's own catalogue and sourcing requests |
| Bundles (several items as one kit) | Bundle mapping is an **Advanced** (paid) feature | Ask CJ to source or pack the kit as one SKU; confirm in app |
| Paying the supplier | Through your linked AliExpress account | From your CJ wallet or card |
| Shipping to Australia | Depends on the seller and shipping method; often slower | Check whether the item ships from a local or regional warehouse |
| Tracking back to Shopify | Yes, syncs tracking numbers | Yes, generates and syncs tracking |

**Recommendation:** order samples of the kit from both (directly, to your own
address) before choosing. Compare build quality, real delivery time to your
postcode, and packaging. If the kit is several separate AliExpress items,
CJ packing it as one SKU may be cheaper than DSers' paid bundle mapping.

## 2. Connect the app

1. Install the app from the Shopify App Store. You (the owner) approve the
   permissions it requests.
2. In the app's settings, **turn automatic ordering and automatic payment
   OFF** (DSers: Settings → automation / auto order; CJ: Settings →
   automatic order processing and payment). Keep them off until you have
   completed the test steps below and decided to enable them.
3. Link your AliExpress account (DSers) or set up your CJ account and wallet.

## 3. Connect the product (keep the existing Shopify product)

The storefront shows the Shopify product with handle `clean-desk-kit`. Don't
import a second copy; connect the supplier to the existing product instead:

- **DSers:** use *Supplier mapping* on the existing Shopify product and pick
  the AliExpress listing. Map **every Shopify variant** to the matching
  supplier variant. For a multi-item kit, use *Bundle mapping* (Advanced).
- **CJ:** use *Connect* / *Product connection* to link the Shopify product to
  the CJ product, and map every variant.

Then check in Shopify that price (A$29.95), title, images and description
are still yours. Turn off any app setting that overwrites price or
description automatically, so Shopify stays the single source of truth.

## 4. Shipping in Shopify

1. Shopify admin → Settings → Shipping and delivery → create a profile for
   Australia with rates that cover your supplier shipping cost.
2. Only publish delivery timeframes after you have measured them with real
   sample orders. Then write your shipping policy in Settings → Policies; the
   site's Shipping page shows it automatically.

## 5. How an order flows

1. Customer pays on Shopify checkout → Shopify creates the order and emails
   an order confirmation.
2. The order appears in the supplier app as *awaiting order*.
3. **You review it and click to place the supplier order** (manual while
   auto-ordering is off), then pay the supplier.
4. The supplier ships and the app writes the tracking number to Shopify,
   which marks the order fulfilled and emails the customer.

A Shopify order, a webhook, or a "placed" status in the app is **not** proof
the parcel shipped. Only a tracking number that scans with the carrier is.

## 6. Test orders must never reach the supplier

Orders paid with Shopify's test gateway (card number `1`) are real Shopify
orders and will show up in the supplier app.

- Tag test orders `TEST` in Shopify, then cancel and refund them.
- In the supplier app, archive or ignore them. Never click *place order* on
  them.
- Keep auto-ordering off while any test orders exist, so they can't be placed
  automatically.

## 7. One real end-to-end order

After the test checkout works, do one real paid order to your own address
with live payments (see `docs/LAUNCH.md`), place it with the supplier
manually, and confirm: payment captured, supplier order paid, tracking synced
to Shopify, shipping email received, parcel arrives as described.

## 8. Turning on automatic ordering (later, optional)

Only after the real order succeeded, and only if you want it: enable
auto-order in the app, set a spending limit if the app offers one, and keep
watching the first few orders.
