import Link from "next/link";
import { ProductGrid } from "@/components/shop/product-grid";
import { getProducts } from "@/lib/shopify/products";

/** Newest products in Shopify. Hidden when there's nothing to show. */
export async function NewArrivals() {
  const products = await getProducts({ first: 8, sortKey: "CREATED_AT", reverse: true }).catch(() => []);
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="new-heading" className="border-t border-foreground/10">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="new-heading" className="text-title font-semibold">
            New in
          </h2>
          <Link href="/shop" className="text-sm font-medium underline underline-offset-4">
            View all products
          </Link>
        </div>
        <div className="mt-8">
          <ProductGrid products={products} headingLevel="h3" className="lg:grid-cols-4" />
        </div>
      </div>
    </section>
  );
}
