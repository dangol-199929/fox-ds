import type { Cart, Image, Product, ProductVariant } from "./types";

// Raw Storefront API shapes (only the parts we query).

type Connection<T> = { nodes: T[] };

export type RawProduct = Omit<Product, "options" | "images" | "variants"> & {
  options: { name: string; optionValues: { name: string }[] }[];
  images: Connection<Image>;
  variants: Connection<ProductVariant>;
};

export type RawCart = Omit<Cart, "lines"> & {
  lines: Connection<
    Omit<Cart["lines"][number], "merchandise"> & {
      // Non-variant merchandise would arrive as {}; we only sell variants.
      merchandise: Partial<Cart["lines"][number]["merchandise"]>;
    }
  >;
};

export function reshapeProduct(raw: RawProduct): Product {
  return {
    ...raw,
    options: raw.options.map((option) => ({
      name: option.name,
      values: option.optionValues.map((value) => value.name),
    })),
    images: raw.images.nodes,
    variants: raw.variants.nodes,
  };
}

export function reshapeCart(raw: RawCart): Cart {
  return {
    ...raw,
    lines: raw.lines.nodes.flatMap((line) => {
      const m = line.merchandise;
      if (!m.id || !m.product) return [];
      return [
        {
          ...line,
          merchandise: {
            id: m.id,
            title: m.title ?? "",
            availableForSale: m.availableForSale ?? false,
            selectedOptions: m.selectedOptions ?? [],
            image: m.image ?? null,
            product: m.product,
          },
        },
      ];
    }),
  };
}

/**
 * Shopify gives single-variant products one option called "Title" with the
 * value "Default Title". That isn't a real choice, so hide it in the UI.
 */
export function hasRealOptions(product: Product): boolean {
  return !(
    product.variants.length === 1 &&
    product.options.length === 1 &&
    product.options[0]?.values.length === 1 &&
    product.options[0]?.values[0] === "Default Title"
  );
}
