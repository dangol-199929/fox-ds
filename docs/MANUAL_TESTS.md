# Manual test guide

Run these in order. Steps 1–5 use Shopify's test gateway and **must never be
sent to a supplier**. Steps 6–8 involve real money and a real parcel.

Before you start: Settings → Payments shows the **(for testing) Bogus
Gateway** active, and the supplier app has **auto-ordering off**.

## 1. Product browsing
- [ ] Home page loads; the kit shows its live Shopify price (A$29.95) and stock state.
- [ ] Shop page lists products. With 4+ products, filters (availability, price) and sorting work and update the URL; Back/Forward restore them.
- [ ] Product page shows title, price, description, details and FAQ. A sold-out variant (set stock to 0 in Shopify) shows **Sold out** and can't be added.
- [ ] An unknown product URL (e.g. `/products/nope`) shows the not-found page.
- [ ] Repeat at phone width (375px) and desktop; no sideways scrolling.

## 2. Cart operations
- [ ] Add to cart opens the cart drawer with the right item, price and subtotal.
- [ ] + / − change quantity; subtotal updates. − at 1 removes the item.
- [ ] Remove (bin icon) empties the cart and shows the empty state.
- [ ] Asking for more than the stock shows Shopify's "Only N items were added" notice.
- [ ] Reload the page: the cart is still there (cookie-based).

## 3. Redirect to Shopify checkout
- [ ] Checkout goes to `my0eiu-8r.myshopify.com/checkouts/...` showing the same items and total.
- [ ] While the store password is on, Shopify asks for it first (expected on the trial).

## 4. Test payment and order creation
- [ ] Use card number **1** (approve), any future expiry, any 3-digit CVV, an Australian address.
- [ ] The order appears in Shopify admin → Orders, marked as a test.
- [ ] Card **2** shows a decline; card **3** a gateway error; no order is created.
- [ ] **Tag the test order `TEST`, cancel and refund it.** In DSers/CJ, archive it. Never place it with the supplier.

## 5. Emails and inventory
- [ ] Order confirmation email arrives (Settings → Notifications to customise).
- [ ] Stock for the kit went down by the quantity ordered; cancelling with restock puts it back.
- [ ] Within a minute the storefront shows the new stock state (needs the webhook, see LAUNCH.md).
- [ ] Newsletter: sign up from the footer, then find the customer in Shopify → Customers with **Email subscribed**. Signing up again shows the same success message. Test unsubscribe from a Shopify Email test send.

## 6. One real paid sample order
Only after LAUNCH.md steps 1–4 (live payments on, test gateway off).
- [ ] Order one kit to your own address with a real card.
- [ ] Payment shows as **Paid** in Shopify and in your Shopify Payments payouts.

## 7. Supplier receipt, fulfilment and tracking
- [ ] The order appears in DSers/CJ. Place it **manually** and pay the supplier.
- [ ] Tracking syncs to Shopify; the order becomes **Fulfilled**; the customer shipping email arrives.
- [ ] The tracking number scans with the carrier. Note the real delivery time for your shipping policy.
- [ ] If accounts are on: the order and tracking show under **Your account**.

## 8. Refunds and cancellations
- [ ] Cancel before the supplier order is placed: Shopify → Cancel order → refund. Nothing to do in the supplier app.
- [ ] Cancel after it's placed: request cancellation in DSers/CJ first; refund the customer only once the supplier confirms (or per your policy).
- [ ] Partial refund: Shopify → Refund → choose items/amount; the customer gets a refund email.
- [ ] Check refunds match your published Returns & refunds policy and Australian Consumer Law.
