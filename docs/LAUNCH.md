# Deployment and launch checklist

## 1. Shopify store
- [ ] Rename the store from "My Store" to **Clean Desk Kit** (Settings → General). The name appears in checkout, emails and product data.
- [ ] Pick a paid plan. Basic is **A$56/month** (A$42/month billed yearly) and includes one headless storefront. Prices checked 16 Oct 2026 at shopify.com/au/pricing.
- [ ] Remove the storefront password (Online Store → Preferences). Shopify only allows this on a paid plan.
- [ ] Write the policies (Settings → Policies): refund, shipping, terms. The site shows them automatically. Get advice on your obligations under Australian Consumer Law.
- [ ] Shipping profile for Australia with real rates; delivery times only from measured sample orders. **If you change the rate or the free-shipping threshold, update `shippingConfig` in `lib/site.ts` too.** The announcement bar, home page, product pages and cart meter quote it (currently A$7.25 flat, free over A$60); Shopify checkout always charges the real rate.
- [ ] Every product has a **Type** in Shopify admin that matches a category in `lib/site.ts` (Cable management, Stands & risers, Desk mats, Lighting, Desk accessories). That's what puts it in a category; empty categories hide themselves.
- [x] Supplier photos with logos or marketing text were cropped or detached (17 Oct 2026). Detached photos are kept in Shopify under Content → Files. Check new products' photos the same way, and only show colours and models you actually sell.
- [ ] Taxes: decide whether prices include GST (Settings → Taxes and duties) and register for GST if required.
- [ ] Product: real photos with alt text, final description, kit contents, specifications. Then remove the "To be confirmed" placeholders in `lib/content.ts` and the product page.

## 2. Payments: turn test mode off
- [ ] Complete Shopify Payments setup (business and bank details).
- [ ] **Deactivate the (for testing) Bogus Gateway** (Settings → Payments → it → Deactivate).
- [ ] If Shopify Payments test mode is on, turn it off.
- [ ] Cancel and archive all `TEST` orders.

## 3. Deploy to Vercel

Current development deployment: Vercel project **fox-ds** (Hobby) at `https://fox-ds.vercel.app`, deploying from `main`. Webhooks (product create/update/delete, inventory level update, collection update) and the Customer Account API redirect URLs already point at this address. Update both when the custom domain is connected.

The free **Hobby** plan is fine for development and testing (what we use now). Vercel's terms limit Hobby to personal, non-commercial use, so **move to Pro (US$20/month) before taking real orders**, or switch to Cloudflare Workers via OpenNext (extra setup).

1. vercel.com → Add New → Project → import `dangol-199929/fox-ds`. The framework is detected as Next.js. Node 24 comes from `package.json` engines.
2. Settings → Environment Variables. Add these for **Production** (and Preview if you test there):

| Variable | Value | Secret? |
|---|---|---|
| `SHOPIFY_STORE_DOMAIN` | `my0eiu-8r.myshopify.com` | No |
| `SHOPIFY_STOREFRONT_API_VERSION` | `2026-10` | No |
| `SHOPIFY_STOREFRONT_PUBLIC_TOKEN` | from Headless → Storefront API | No (public token) |
| `NEXT_PUBLIC_SITE_URL` | your live URL, e.g. `https://cleandeskkit.com.au` | No |
| `SHOPIFY_ADMIN_CLIENT_ID` | Dev Dashboard app | No |
| `SHOPIFY_ADMIN_CLIENT_SECRET` | Dev Dashboard app | **Yes** |
| `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` | Headless → Customer Account API | No |
| `SESSION_SECRET` | 32+ random characters (new value for production) | **Yes** |
| `SHOPIFY_WEBHOOK_SECRET` | from step 5 | **Yes** |
| `SHOPIFY_CHECKOUT_DOMAINS` | only if you connect a custom checkout domain | No |
| `NEXT_PUBLIC_CONTACT_EMAIL` | support inbox | No |
| `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_TIKTOK_URL` | profile links | No |

`NEXT_PUBLIC_*` values are built into the site, so **redeploy after changing them**.

3. Deploy, then connect your domain (Vercel → Domains) and update `NEXT_PUBLIC_SITE_URL`.

## 4. Customer accounts
- [ ] Headless → your storefront → Customer Account API → set up a **Public** client.
- [ ] Callback URI: `https://YOUR-DOMAIN/account/callback`. JavaScript origin: `https://YOUR-DOMAIN`. Logout URI: `https://YOUR-DOMAIN/`.
- [ ] Settings → Customer accounts → use **customer accounts** (the new, passwordless kind).
- [ ] Set `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` and `SESSION_SECRET` in Vercel, then redeploy. Sign in, view orders, edit name, sign out.
- Shopify doesn't accept `localhost` callbacks, so test sign-in on the deployed site (or through an HTTPS tunnel).

## 5. Webhooks (instant price and stock updates)
Shopify admin → Settings → Notifications → Webhooks → create, for each topic: **Product update**, **Product creation**, **Product deletion**, **Inventory level update**, **Collection update**. Format JSON, URL `https://YOUR-DOMAIN/api/webhooks/shopify`, API version `2026-10`. Copy the signing secret shown on that page into `SHOPIFY_WEBHOOK_SECRET` and redeploy. Then change a price in Shopify and check the site updates. Without webhooks, product data refreshes within an hour.

## 6. Final checks
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm test:e2e` pass.
- [ ] Re-run Lighthouse (mobile) on the deployed site. Local production build, 17 Oct 2026, Lighthouse 12 simulated mobile, after the multi-product redesign:

  | Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
  |---|---|---|---|---|---|---|---|
  | Home | 98 | 100 | 100 | 100 | 2.4 s | 0 | 30 ms |
  | Shop | 90 | 100 | 100 | 100 | 3.5 s | 0 | 10 ms |
  | Product (kit) | 91 | 100 | 100 | 100 | 3.5 s | 0 | 30 ms |
  | Product (desk mat) | 88–91 | 100 | 100 | 100 | 3.5–3.9 s | 0 | 10 ms |

  On shop and product pages the LCP element is the first product photo (about 70 KB), which Lighthouse downloads over simulated slow 4G. Photos are resized by Shopify's CDN (`lib/shopify-image-loader.ts`) rather than Vercel's image optimiser, so they're fast on first view and don't use Vercel's image quota. Lighter photos (your own, shot on a plain background) are the next lever. Check real-visitor data with Vercel Speed Insights after launch before optimising further.
- [ ] Check no secrets are committed: `git grep -nE "shpat_|shpss_|SECRET=.+"` should only show `.env.example` placeholders.
- [ ] Do the manual test guide (docs/MANUAL_TESTS.md) end to end, including one real order.
- [ ] Submit `https://YOUR-DOMAIN/sitemap.xml` in Google Search Console.

## Recurring costs (estimate, check current prices)
| Item | Cost |
|---|---|
| Shopify Basic | A$56/month (A$42 yearly) |
| Card fees (Shopify Payments, Basic) | 1.7% + 30¢ per domestic card payment |
| Vercel Pro | US$20/month (Hobby can't be used commercially) |
| Domain | about A$15–30/year for `.com.au` |
| DSers | free Basic; Advanced about US$19.90/month if you need bundle mapping |
| CJdropshipping app | free; you pay per order |
| Shopify Email | free monthly allowance, then paid |

## Known limitations
- **Photos:** products use the supplier's photos until you upload your own. A product with no photo at all shows a labelled placeholder.
- **Placeholders:** kit contents, specifications, shipping times and the refund policy are marked "To be confirmed" until supplied.
- **Rate limits:** newsletter rate limiting and webhook de-duplication are in memory, per server instance. They're adequate for launch traffic and documented in code. Use a shared store such as Upstash Redis if you need hard limits.
- **Storefront token:** the public Storefront token is used from the server. Shopify recommends a private token plus the buyer's IP for server-side calls at scale. Consider switching before high traffic.
- **Recommendations:** "You might also like" uses Shopify's recommendations, then falls back to other products in the catalogue.
- **Filters:** shop filters appear once there are 4+ products. Extra filter types come from Shopify's Search & Discovery app. Categories use Shopify's `product_type:` search syntax, so they work without Search & Discovery set-up.
- **Search:** Shopify's storefront search is fuzzy (a search for "stand" also matches related products). Category pages share the `/shop` canonical URL for now.
- **Cart recommendations:** the cart drawer doesn't show recommendations, to keep it fast.
- **Order emails:** the order confirmation email doesn't include a newsletter opt-in. Shopify's own checkout has an optional "Email me with news and offers" box.
