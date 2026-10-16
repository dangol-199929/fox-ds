import type { Money } from "@/lib/shopify/types";

/** Formats Shopify money for Australian shoppers, e.g. "$29.95 AUD" → "$29.95". */
export function formatMoney(money: Money): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: money.currencyCode,
    currencyDisplay: "narrowSymbol",
  }).format(Number(money.amount));
}
