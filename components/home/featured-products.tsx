import Link from "next/link";
import { ProductCard } from "@/components/shop/product-card";
import { getCollectionProducts } from "@/lib/shopify/products";
import { siteConfig } from "@/lib/site";

/**
 * Compact supporting collection under the hero product, merchandised from a
 * Shopify collection. Excludes the hero product and hides itself when there's
 * nothing else to show, so the homepage never has empty product slots.
 */
export async function FeaturedProducts() {
  const collection = await getCollectionProducts(siteConfig.featuredCollectionHandle, 8).catch(() => null);
  const products = (collection?.products ?? [])
    .filter((p) => p.handle !== siteConfig.featuredProductHandle)
    .slice(0, 3);

  if (products.length === 0) return null;

  return (
    <section aria-labelledby="more-heading" className="border-t border-foreground/10">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="more-heading" className="text-headline font-semibold">
            More for your desk
          </h2>
          <Link href="/shop" className="font-medium underline underline-offset-4">
            Shop everything
          </Link>
        </div>
        <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} headingLevel="h3" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
