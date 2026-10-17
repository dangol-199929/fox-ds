import { ProductGrid } from "@/components/shop/product-grid";
import { getRecommendedProducts } from "@/lib/shopify/recommendations";
import { siteConfig } from "@/lib/site";

/**
 * "You might also like" row. Hidden entirely when Shopify has nothing suitable,
 * so a small catalogue never shows an empty or padded section.
 */
export async function RecommendedProducts({ handle }: { handle: string }) {
  const products = await getRecommendedProducts(handle, {
    fallbackCollection: siteConfig.featuredCollectionHandle,
  }).catch(() => []);

  if (products.length === 0) return null;

  return (
    <section aria-labelledby="recommended-heading" className="border-t border-foreground/10">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 lg:py-20">
        <h2 id="recommended-heading" className="text-title font-semibold">
          You might also like
        </h2>
        <div className="mt-8">
          <ProductGrid products={products} headingLevel="h3" className="lg:grid-cols-4" />
        </div>
      </div>
    </section>
  );
}
