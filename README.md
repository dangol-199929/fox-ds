# Clean Desk Kit

Headless Shopify storefront for Clean Desk Kit, an Australian cable-management brand.

Stack: Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Base UI), Lucide icons, Shopify Storefront API, Shopify-hosted checkout, pnpm, Vercel.

> Work in progress. Shopify integration, storefront pages, accounts and deployment notes are added phase by phase.

## Requirements

- Node.js 24 LTS (see `.nvmrc`; 22.12+ also works). Run `nvm use` in this folder.
- pnpm 10 (pinned in `package.json`). With Corepack: `corepack enable`, or run any command as `npx pnpm@10.34.7 <command>`.
- Google Chrome, for the Playwright end-to-end tests.

## Setup

```bash
nvm use
pnpm install
cp .env.example .env.local   # then fill in values; .env.local is git-ignored
pnpm dev
```

## Environment variables

| Variable | Sensitivity | Notes |
|---|---|---|
| `SHOPIFY_STORE_DOMAIN` | Not sensitive | `your-store.myshopify.com`, no `https://` |
| `SHOPIFY_STOREFRONT_API_VERSION` | Not sensitive | Stable quarterly version, e.g. `2026-10` |
| `SHOPIFY_STOREFRONT_PUBLIC_TOKEN` | Public by Shopify's design, but kept server-side | From the Headless sales channel. No `NEXT_PUBLIC_` prefix, so it is never bundled into browser JavaScript. |
| `SHOPIFY_CHECKOUT_DOMAINS` | Not sensitive, optional | Extra checkout hostnames (comma-separated) once a custom domain is connected. The `*.myshopify.com` domain is always allowed. |
| `SHOPIFY_WEBHOOK_SECRET` | **Secret** | Server only. Used to verify webhook signatures. |
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical site URL. Must be `https` outside localhost. |

Values are validated with Zod in `lib/env.ts`. Errors name the variable and rule, never the value.

Never commit real credentials. This repository is public.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Generates Next.js route types, then runs `tsc --noEmit` |
| `pnpm test` | Unit and component tests (Vitest + Testing Library) |
| `pnpm test:live` | Live checks against the Shopify store in `.env.local`: reads the product and runs a cart round trip. Creates throwaway carts only, never orders. |
| `pnpm test:e2e` | Playwright tests on desktop and mobile, including no-overflow checks at 320–1440px |

## Shopify integration

All Shopify calls run on the server (`lib/shopify/*`, guarded by `server-only`).

- `client.ts`: Storefront API fetch with a 10s timeout, one retry for queries (never for mutations), and typed errors whose shopper-facing messages never reveal internals.
- `products.ts`: product and collection queries, cached with `"use cache"` for an hour and tagged (`shopify:products`, `shopify:product:<handle>`) for on-demand revalidation.
- `cart.ts`: cart create/read/add/update/remove. IDs and quantities (1 to 20 per line) are validated before anything is sent. Never cached.
- `cart-session.ts`: the cart ID lives only in an HttpOnly, SameSite=Lax cookie (`Secure` in production) that expires with Shopify's 10-day cart lifetime.
- `app/actions/cart.ts`: Server Actions for the UI. They never accept a cart ID from the browser, and only change lines that belong to the cookie's cart.
- `checkout.ts`: the checkout redirect only goes to an `https` URL on the store's own domain (or a configured checkout domain). Card details are only ever entered on Shopify's checkout.

Prices are requested with `@inContext(country: AU)`, so they come back in AUD from Shopify Markets.

## Design tokens

Defined in `app/globals.css`: warm off-white `#F7F6F2`, near-black `#20211F`, soft grey `#ECEDE7`, electric lime `#C8F169`. Lime is only ever a fill behind charcoal text (it has about 1.2:1 contrast on the background), so focus rings are charcoal.
