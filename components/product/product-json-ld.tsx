import { siteUrl } from "@/lib/site-url";
import type { Product } from "@/lib/shopify/types";

/**
 * schema.org Product data built only from Shopify's product data: name,
 * description, images, price, currency and availability. No ratings, reviews
 * or claims are included because none exist yet.
 */
export function ProductJsonLd({ product }: { product: Product }) {
  const url = new URL(`/products/${product.handle}`, siteUrl()).toString();
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || undefined,
    image: product.images.map((i) => i.url),
    url,
    brand: product.vendor ? { "@type": "Brand", name: product.vendor } : undefined,
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      url,
      price: variant.price.amount,
      priceCurrency: variant.price.currencyCode,
      availability: variant.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    })),
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD must be inline. `<` is escaped so product text can't close the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
