# Store policy drafts

Drafts of the four policies the site shows at `/shipping`, `/refunds`, `/privacy` and `/terms`. They're written for how the store actually runs today: an Australian online store, prices in AUD, orders fulfilled by overseas suppliers through DSers/AliExpress, Shopify-hosted checkout.

**These are starting drafts, not legal advice.** Have them checked by someone qualified (for example a lawyer, or your state's fair trading or small business advisory service) before you rely on them.

## Before you publish

1. Replace every `[SQUARE BRACKET]` placeholder. Search for `[` to find them all.
2. Make the two decisions marked **DECISION** in the refund policy (change-of-mind returns, and whether low-value faulty items need to be sent back).
3. Only fill in delivery times once your test orders have actually arrived. Use the slowest real delivery you saw, not the supplier's estimate.
4. If you change the shipping rate in Shopify, change it here and in `shippingConfig` in `lib/site.ts` too.

## How to publish

Shopify admin → **Settings → Policies**. Paste each draft into its matching box (Refund policy, Privacy policy, Terms of service, Shipping policy) and save. The site picks them up within an hour, or straight away if a product webhook fires. Until a policy is saved in Shopify, its page on the site says it's being finalised.

Tip: Shopify's policy editor is rich text. Paste the text, then use the editor's heading and list buttons to match the structure here, or switch to the editor's HTML view if you're comfortable with it.

| Draft | Shopify box | Site page |
|---|---|---|
| [shipping-policy.md](shipping-policy.md) | Shipping policy | `/shipping` |
| [refund-policy.md](refund-policy.md) | Refund policy | `/refunds` |
| [privacy-policy.md](privacy-policy.md) | Privacy policy | `/privacy` |
| [terms-of-service.md](terms-of-service.md) | Terms of service | `/terms` |
