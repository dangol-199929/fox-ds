import { ProductCard } from "@/components/shop/product-card";
import { getRecommendedProducts } from "@/lib/shopify/recommendations";
import { siteConfig } from "@/lib/site";

/**
 * "Pairs well with" row. Hidden entirely when Shopify has nothing suitable,
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
          Pairs well with
        </h2>
        <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
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
