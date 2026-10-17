import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchForm } from "@/components/layout/search-form";
import { FilterSidebar, ShopControls } from "@/components/shop/product-filters";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid";
import { buttonVariants } from "@/components/ui/button";
import {
  activeFilterCount,
  parseShopParams,
  searchQuery,
  shopHref,
  toProductFilters,
  type ShopParams,
} from "@/lib/shop-params";
import { getProducts } from "@/lib/shopify/products";
import { searchProducts } from "@/lib/shopify/search";
import { categories, categoryBySlug } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop cable management, laptop stands, desk mats and desk accessories. Australian store, prices in AUD.",
  alternates: { canonical: "/shop" },
};

// Filters and sorting only appear once the catalogue is big enough for them
// to help. With one or two products, they would just be clutter.
const FILTERS_FROM = 4;
const SORT_FROM = 2;

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<ShopFallback />}>
        <ShopResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function ShopFallback() {
  return (
    <>
      <ShopHeading params={null} />
      <ProductGridSkeleton />
    </>
  );
}

function ShopHeading({ params }: { params: ShopParams | null }) {
  const category = categoryBySlug(params?.category);
  const title = params?.q ? `Results for “${params.q}”` : (category?.label ?? "Shop all");

  return (
    <div className="mb-6 space-y-4">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          {category || params?.q ? (
            <>
              <li>
                <Link href="/shop" className="hover:underline">
                  Shop
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground">
                {params?.q ? "Search" : category!.label}
              </li>
            </>
          ) : (
            <li aria-current="page" className="text-foreground">
              Shop
            </li>
          )}
        </ol>
      </nav>
      <h1 className="text-title font-semibold break-words sm:text-headline">{title}</h1>
      {params?.q && (
        <div className="flex max-w-xl flex-wrap items-center gap-3">
          <SearchForm id="shop-search" defaultValue={params.q} category={params.category} className="min-w-0 flex-1" />
          <Link href={shopHref({ ...params, q: null })} className="text-sm font-medium underline underline-offset-4">
            Clear search
          </Link>
        </div>
      )}
    </div>
  );
}

/** Category pills with live product counts. Empty categories are hidden. */
async function CategoryPills({ params }: { params: ShopParams }) {
  const all = await getProducts({ first: 100 }).catch(() => []);
  const counts = new Map<string, number>();
  for (const p of all) counts.set(p.productType, (counts.get(p.productType) ?? 0) + 1);
  const visible = categories.filter((c) => (counts.get(c.productType) ?? 0) > 0);
  if (visible.length < 2) return null;

  const base = { ...params, filterIds: [], minPrice: null, maxPrice: null };
  const pill = (active: boolean) =>
    cn(
      "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
      active ? "border-foreground bg-foreground text-background" : "border-input hover:border-foreground",
    );

  return (
    <nav aria-label="Categories" className="-mx-4 mb-8 border-b border-foreground/10 px-4 pb-6 sm:mx-0 sm:px-0">
      <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <li className="shrink-0">
          <Link href={shopHref({ ...base, category: null })} className={pill(!params.category)} aria-current={!params.category ? "page" : undefined}>
            All
            <span className="tabular-nums opacity-70">{all.length}</span>
          </Link>
        </li>
        {visible.map((c) => {
          const active = params.category === c.slug;
          return (
            <li key={c.slug} className="shrink-0">
              <Link href={shopHref({ ...base, category: c.slug })} className={pill(active)} aria-current={active ? "page" : undefined}>
                {c.label}
                <span className="tabular-nums opacity-70">{counts.get(c.productType)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

async function ShopResults({ searchParams }: { searchParams: PageProps<"/shop">["searchParams"] }) {
  const params = parseShopParams(await searchParams);
  const active = activeFilterCount(params);

  // Unfiltered search gives Shopify's filter definitions and the full count.
  const base = await searchProducts();
  const productFilters = toProductFilters(params, base.filters);
  const query = searchQuery(params);
  const searched =
    productFilters.length > 0 || params.sort !== "featured" || query
      ? await searchProducts({ query, sort: params.sort, productFilters })
      : base;
  // Belt and braces: never show another category's products in a category.
  const category = categoryBySlug(params.category);
  const result = category
    ? { ...searched, products: searched.products.filter((p) => p.productType === category.productType) }
    : searched;

  const showFilters = base.totalCount >= FILTERS_FROM || active > 0;
  const showSort = base.totalCount >= SORT_FROM;
  const groups = result.filters.length > 0 ? result.filters : base.filters;
  const narrowed = active > 0 || params.category || params.q;

  return (
    <>
      <ShopHeading params={params} />
      <CategoryPills params={params} />
      <div className={showFilters ? "grid gap-10 lg:grid-cols-[14rem_1fr]" : undefined}>
        {showFilters && <FilterSidebar groups={groups} params={params} />}
        <div className="min-w-0 space-y-8">
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
          ) : narrowed ? (
            <div className="flex flex-col items-start gap-4 py-16">
              <p className="text-xl font-medium">
                {params.q ? `Nothing matches “${params.q}”.` : "No products match these filters."}
              </p>
              <p className="text-muted-foreground">
                {params.q ? "Check the spelling or try a broader word, like “stand” or “cable”." : "Try removing a filter or widening the price range."}
              </p>
              <Link href="/shop" className={buttonVariants({ variant: "outline" })}>
                {params.q ? "See all products" : "Clear all filters"}
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
    </>
  );
}
