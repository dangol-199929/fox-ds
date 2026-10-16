import type { Product } from "@/lib/shopify/types";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product, i) => (
        <li key={product.id}>
          <ProductCard product={product} priority={i < 3} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton() {
  return (
    <div aria-busy="true">
      <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <li key={i} className="space-y-4">
            <div className="aspect-[4/5] animate-pulse rounded-lg bg-secondary" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-secondary" />
          </li>
        ))}
      </ul>
      <p className="sr-only">Loading products…</p>
    </div>
  );
}
