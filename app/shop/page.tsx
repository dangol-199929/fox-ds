import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FilterSidebar, ShopControls } from "@/components/shop/product-filters";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid";
import { buttonVariants } from "@/components/ui/button";
import { activeFilterCount, parseShopParams, toProductFilters } from "@/lib/shop-params";
import { searchProducts } from "@/lib/shopify/search";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop the Clean Desk Kit and desk organisation essentials. Prices in AUD.",
  alternates: { canonical: "/shop" },
};

// Filters and sorting only appear once the catalogue is big enough for them
// to help. With one or two products, they would just be clutter.
const FILTERS_FROM = 4;
const SORT_FROM = 2;

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8 lg:py-16">
      <h1 className="mb-8 border-b border-foreground/15 pb-8 text-headline font-semibold">Shop</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ShopResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ShopResults({ searchParams }: { searchParams: PageProps<"/shop">["searchParams"] }) {
  const params = parseShopParams(await searchParams);
  const active = activeFilterCount(params);

  // Unfiltered search gives Shopify's filter definitions and the full count.
  const base = await searchProducts();
  const productFilters = toProductFilters(params, base.filters);
  const result =
    productFilters.length > 0 || params.sort !== "featured"
      ? await searchProducts({ sort: params.sort, productFilters })
      : base;

  const showFilters = base.totalCount >= FILTERS_FROM || active > 0;
  const showSort = base.totalCount >= SORT_FROM;
  const groups = result.filters.length > 0 ? result.filters : base.filters;

  return (
    <div className={showFilters ? "grid gap-10 lg:grid-cols-[15rem_1fr]" : undefined}>
      {showFilters && <FilterSidebar groups={groups} params={params} />}
      <div className="space-y-8">
        {(showFilters || showSort) && (
          <ShopControls
            groups={groups}
            params={params}
            resultCount={result.products.length}
            showFilters={showFilters}
            showSort={showSort}
          />
        )}
        {result.products.length > 0 ? (
          <ProductGrid products={result.products} />
        ) : active > 0 ? (
          <div className="flex flex-col items-start gap-4 py-16">
            <p className="text-xl font-medium">No products match these filters.</p>
            <p className="text-muted-foreground">Try removing a filter or widening the price range.</p>
            <Link href="/shop" className={buttonVariants({ variant: "outline" })}>
              Clear all filters
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 py-16">
            <p className="text-xl font-medium">Nothing in the shop just yet.</p>
            <p className="text-muted-foreground">New products are on the way. Please check back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
