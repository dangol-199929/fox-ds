import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { getProducts } from "@/lib/shopify/products";
import type { Product } from "@/lib/shopify/types";
import { categories, siteConfig } from "@/lib/site";

export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-8 pb-14 sm:px-8 md:grid-cols-[1fr_1.05fr] md:gap-12 md:pt-14 md:pb-20">
        <div className="relative z-10 flex flex-col items-start gap-6">
          <p className="flex items-center gap-2 text-eyebrow font-medium uppercase text-muted-foreground">
            <span className="size-2 rounded-full bg-lime ring-1 ring-foreground/30" aria-hidden="true" />
            Desk accessories · Australia
          </p>
          <h1 id="hero-heading" className="text-display font-semibold text-balance">
            Everything for a calmer desk.
          </h1>
          <p className="max-w-md text-lg text-muted-foreground sm:text-xl">
            Cable management, stands, desk mats and lighting to make your workspace feel put together.
          </p>
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link href="/shop" className={buttonVariants({ size: "lg" })}>
              Shop all products
            </Link>
            <Link
              href={`/products/${siteConfig.featuredProductHandle}`}
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Shop the Clean Desk Kit
            </Link>
          </div>
        </div>
        <Suspense fallback={<CollageFrame />}>
          <HeroCollage />
        </Suspense>
      </div>
    </section>
  );
}

/** One product per category, so the hero shows the range, not one item. */
function pickHeroProducts(products: Product[]): Product[] {
  const withImages = products.filter((p) => p.featuredImage && p.availableForSale);
  const picked: Product[] = [];
  for (const category of categories) {
    const match = withImages.find((p) => p.productType === category.productType && !picked.includes(p));
    if (match) picked.push(match);
  }
  for (const p of withImages) if (picked.length < 4 && !picked.includes(p)) picked.push(p);
  return picked.slice(0, 4);
}

async function HeroCollage() {
  const products = pickHeroProducts(await getProducts({ first: 50 }).catch(() => []));
  return (
    <CollageFrame>
      {products.map((product, i) => (
        <li key={product.id} className="relative overflow-hidden rounded-lg bg-secondary">
          <Link href={`/products/${product.handle}`} className="group block size-full">
            <Image
              src={product.featuredImage!.url}
              alt={product.featuredImage!.altText || product.title}
              fill
              priority={i === 0}
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <span className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium backdrop-blur-sm sm:right-2">
              <span className="hidden min-w-0 flex-1 truncate sm:block">{product.title}</span>
              <span className="shrink-0 tabular-nums">{formatMoney(product.priceRange.minVariantPrice)}</span>
            </span>
          </Link>
        </li>
      ))}
      {/* Plain tiles keep the 2×2 shape while the catalogue is small. */}
      {Array.from({ length: 4 - products.length }, (_, i) => (
        <li key={`empty-${i}`} className="rounded-lg bg-secondary" aria-hidden="true" />
      ))}
    </CollageFrame>
  );
}

/** Fixed-size 2×2 frame, so the hero never shifts while products load. */
function CollageFrame({ children }: { children?: React.ReactNode }) {
  return (
    <ul className="grid aspect-square grid-cols-2 grid-rows-2 gap-2 sm:gap-3" aria-label={children ? "Featured products" : undefined}>
      {children ??
        [0, 1, 2, 3].map((i) => <li key={i} className="animate-pulse rounded-lg bg-secondary" aria-hidden="true" />)}
    </ul>
  );
}
