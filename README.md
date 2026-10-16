# Clean Desk Kit

Headless Shopify storefront for Clean Desk Kit, an Australian cable-management brand.

**Stack:** Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Base UI), Lucide, Shopify Storefront API, Shopify Customer Account API, Shopify-hosted checkout, pnpm, Vercel.

Shopify is the source of truth for products, prices, stock, carts, orders, policies and customers. This app never collects card details: checkout happens on Shopify.

## Guides

- [docs/LAUNCH.md](docs/LAUNCH.md): Vercel deployment, environment variables, going live (turning off test payments), recurring costs, known limitations
- [docs/MANUAL_TESTS.md](docs/MANUAL_TESTS.md): manual test guide, from browsing through to a real order and refunds
- [docs/SUPPLIER.md](docs/SUPPLIER.md): DSers / CJdropshipping setup, order flow and tracking

## Requirements

- Node.js 24 LTS (`.nvmrc`; 22.12+ also works). Run `nvm use`.
- pnpm 10 (pinned in `package.json`): `corepack enable`, or prefix commands with `npx pnpm@10.34.7`.
- Google Chrome, for the Playwright tests.

## Local setup

```bash
nvm use
pnpm install
cp .env.example .env.local   # fill in values; .env.local is git-ignored
pnpm dev
```

`.env.example` documents every variable, which ones are secret, and where to find each value. Only the Storefront variables are needed to browse and check out. The newsletter, accounts and webhooks each need their own values (see docs/LAUNCH.md).

Never commit real credentials. **This repository is public.**

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Generates Next.js route types, then `tsc --noEmit` |
| `pnpm test` | Unit and component tests (Vitest). No network access needed. |
| `pnpm test:live` | Read-only checks plus throwaway carts against the store in `.env.local`. Never creates orders. |
| `pnpm test:e2e` | Playwright: builds and starts the app on port 3100, then checks every page at 320–1440px on desktop and mobile, plus the menu, FAQ, filters and not-found states |

## How it fits together

```
app/                      routes (home, shop, products/[handle], policies, account, api/webhooks)
app/actions/              Server Actions: cart, newsletter, profile
components/               UI (cart, product, shop, home, layout, newsletter, account, ui = shadcn)
lib/shopify/              Storefront API client, products, search, cart, checkout URL check,
                          recommendations, policies, Admin API (newsletter only)
lib/customer-account/     OAuth + PKCE, encrypted session cookie, Customer Account API
lib/webhooks/             HMAC verification and delivery de-duplication
tests/unit, tests/live, tests/e2e
```

### Security notes

- All Shopify calls run on the server (`server-only`). The browser never receives a Shopify token.
- **Cart identity:** the cart ID lives only in an HttpOnly cookie. Cart actions never accept a cart ID from the browser, and only change lines that belong to that cart.
- **Checkout redirects** only go to `https` URLs on the store's own domain.
- **Customer sessions** use an AES-256-GCM encrypted HttpOnly cookie. Sign-in uses PKCE, state and nonce checks. Return URLs are restricted to this site.
- **Webhooks** are verified with HMAC against the raw body and de-duplicated. They only refresh caches.
- **Newsletter:** validated on the server, needs explicit consent, and has a honeypot and rate limiting. Logs never include email addresses.
- **Cart and account data** are never cached. Public product data is cached for an hour and refreshed by webhook.

## Design tokens

Defined in `app/globals.css`: warm off-white `#F7F6F2`, near-black `#20211F`, soft grey `#ECEDE7`, electric lime `#C8F169`. Lime is only ever used as a fill behind charcoal text (it has about 1.2:1 contrast on the background), so focus rings are charcoal.
