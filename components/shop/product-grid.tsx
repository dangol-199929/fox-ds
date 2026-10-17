import type { Product } from "@/lib/shopify/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";

const GRID = "grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3";

export function ProductGrid({
  products,
  headingLevel = "h2",
  className = "xl:grid-cols-4",
  priorityCount = 0,
}: {
  products: Product[];
  headingLevel?: "h2" | "h3";
  /**
   * Preload the first N photos. Only for grids at the top of the page;
   * elsewhere it would compete with the page's main image.
   */
  priorityCount?: number;
  /** Extra column rules, e.g. "lg:grid-cols-4" where there's no sidebar. */
  className?: string;
}) {
  return (
    <ul className={cn(GRID, className)}>
      {products.map((product, i) => (
        <li key={product.id}>
          <ProductCard product={product} priority={i < priorityCount} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8, className = "xl:grid-cols-4" }: { count?: number; className?: string }) {
  return (
    <div aria-busy="true">
      <ul className={cn(GRID, className)} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="space-y-3">
            <div className="aspect-square animate-pulse rounded-lg bg-secondary" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-secondary" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-secondary" />
          </li>
        ))}
      </ul>
      <p className="sr-only">Loading products…</p>
    </div>
  );
}
