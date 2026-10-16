import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { formatMoney } from "@/lib/format";
import { hasRealOptions } from "@/lib/shopify/reshape";
import type { Product } from "@/lib/shopify/types";
import { QuickAdd } from "./quick-add";

export function ProductCard({
  product,
  priority = false,
  headingLevel = "h2",
}: {
  product: Product;
  priority?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const hasRange = minVariantPrice.amount !== maxVariantPrice.amount;
  const Heading = headingLevel;
  // Quick add only when there's no choice to make; otherwise go to the page.
  const singleVariant =
    !hasRealOptions(product) && product.variants[0]?.availableForSale ? product.variants[0] : null;

  return (
    <article className="group relative flex flex-col gap-4">
      <ProductImage
        image={product.featuredImage}
        alt={product.title}
        priority={priority}
        sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-[4/5] w-full rounded-lg transition-transform duration-500 group-hover:scale-[1.01]"
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <Heading className="text-lg font-semibold tracking-tight">
            <Link
              href={`/products/${product.handle}`}
              className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring focus-visible:after:rounded-lg"
            >
              {product.title}
            </Link>
          </Heading>
          <p className="font-medium tabular-nums">
            {hasRange && <span className="text-sm text-muted-foreground">From </span>}
            {formatMoney(minVariantPrice)}
          </p>
          {!product.availableForSale && <p className="text-sm text-muted-foreground">Sold out</p>}
        </div>
        {singleVariant && <QuickAdd variantId={singleVariant.id} title={product.title} />}
      </div>
    </article>
  );
}
