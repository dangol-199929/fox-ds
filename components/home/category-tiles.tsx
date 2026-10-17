import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/shopify/products";
import { categories, categoryHref } from "@/lib/site";

/**
 * "Shop by category" tiles. Each tile uses a photo from a product in that
 * category and shows a live count; empty categories are left out.
 */
export async function CategoryTiles() {
  const products = await getProducts({ first: 100 }).catch(() => []);
  const tiles = categories
    .map((category) => {
      const items = products.filter((p) => p.productType === category.productType);
      // The hero uses each category's first product, so pick a different
      // product (or that product's second photo) to avoid repeating images.
      const pick = items.findLast((p) => p.featuredImage);
      const image = (items.length > 1 ? pick?.featuredImage : pick?.images[1]) ?? pick?.featuredImage ?? null;
      return { category, count: items.length, image };
    })
    .filter((t) => t.count > 0);

  if (tiles.length < 2) return null;

  return (
    <section aria-labelledby="categories-heading">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="categories-heading" className="text-title font-semibold">
            Shop by category
          </h2>
          <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4">
            Shop all
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {tiles.map(({ category, count, image }) => (
            <li key={category.slug}>
              <Link href={categoryHref(category)} className="group block">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
                  {image && (
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block font-medium">{category.label}</span>
                    <span className="block text-sm text-muted-foreground">
                      {count} {count === 1 ? "product" : "products"}
                    </span>
                  </span>
                  <ArrowRightIcon
                    className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
