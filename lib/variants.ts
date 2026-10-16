import type { Product, ProductVariant } from "@/lib/shopify/types";

export type Selection = Record<string, string>;

/** First variant that can be bought, or the first variant if none can. */
export function defaultVariant(product: Product): ProductVariant | undefined {
  return product.variants.find((v) => v.availableForSale) ?? product.variants[0];
}

export function selectionOf(variant: ProductVariant | undefined): Selection {
  return Object.fromEntries((variant?.selectedOptions ?? []).map((o) => [o.name, o.value]));
}

export function findVariant(product: Product, selection: Selection): ProductVariant | undefined {
  return product.variants.find((variant) =>
    variant.selectedOptions.every((o) => selection[o.name] === o.value),
  );
}

/**
 * Whether choosing `value` for `optionName`, keeping the other current
 * choices, leads to a variant that exists and is available for sale.
 */
export function isOptionValueAvailable(
  product: Product,
  selection: Selection,
  optionName: string,
  value: string,
): boolean {
  const variant = findVariant(product, { ...selection, [optionName]: value });
  return Boolean(variant?.availableForSale);
}
