import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { getProduct } from "@/lib/shopify/products";
import { siteConfig } from "@/lib/site";

/** The hero product, with live Shopify price, variants and add to cart. */
export async function FeaturedProduct() {
  let product;
  try {
    product = await getProduct(siteConfig.featuredProductHandle);
  } catch {
    return (
      <FeaturedShell>
        <p role="alert" className="text-lg text-muted-foreground">
          We couldn&apos;t load the kit right now. Please refresh the page or try again shortly.
        </p>
      </FeaturedShell>
    );
  }

  if (!product) {
    return (
      <FeaturedShell>
        <p className="text-lg text-muted-foreground">
          The Clean Desk Kit isn&apos;t available right now. Please check back soon.
        </p>
      </FeaturedShell>
    );
  }

  return (
    <FeaturedShell>
      <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-20">
        <Link href={`/products/${product.handle}`} aria-label={`View ${product.title} details`} className="group block">
          <ProductImage
            image={product.featuredImage}
            alt={product.title}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-square w-full rounded-lg transition-transform duration-500 group-hover:scale-[1.01]"
          />
        </Link>
        <div className="flex flex-col gap-6">
          <PurchasePanel product={product} stickyBar={false} />
          {product.description && (
            <p className="max-w-prose text-muted-foreground">{product.description}</p>
          )}
          <Link
            href={`/products/${product.handle}`}
            className="self-start text-sm font-medium underline underline-offset-4"
          >
            Full details, what&apos;s included and FAQ
          </Link>
        </div>
      </div>
    </FeaturedShell>
  );
}

function FeaturedShell({ children }: { children: React.ReactNode }) {
  return (
    <section id="shop" aria-labelledby="featured-heading" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
        <p className="mb-8 flex items-center gap-2 text-eyebrow font-medium uppercase text-muted-foreground">
          <span className="rounded-full bg-lime px-2 py-0.5 text-lime-foreground">02</span>
          <span id="featured-heading">The kit</span>
        </p>
        {children}
      </div>
    </section>
  );
}

export function FeaturedProductSkeleton() {
  return (
    <FeaturedShell>
      <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-20" aria-hidden="true">
        <div className="aspect-square w-full animate-pulse rounded-lg bg-secondary" />
        <div className="space-y-4">
          <div className="h-12 w-3/4 animate-pulse rounded bg-secondary" />
          <div className="h-8 w-1/3 animate-pulse rounded bg-secondary" />
          <div className="h-13 w-full animate-pulse rounded-full bg-secondary" />
        </div>
      </div>
      <p className="sr-only">Loading product…</p>
    </FeaturedShell>
  );
}
