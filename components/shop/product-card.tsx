import Image from "next/image";
import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { formatMoney } from "@/lib/format";
import { categoryByProductType } from "@/lib/site";
import { hasRealOptions } from "@/lib/shopify/reshape";
import type { Product } from "@/lib/shopify/types";
import { QuickAdd } from "./quick-add";

const SIZES = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw";

/** e.g. "3 colours" for the first option with a real choice. */
function optionSummary(product: Product): string | null {
  if (!hasRealOptions(product)) return null;
  const option = product.options.find((o) => o.values.length > 1);
  if (!option) return null;
  const n = option.values.length;
  return `${n} ${option.name.toLowerCase()}${n === 1 ? "" : "s"}`;
}

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
  const category = categoryByProductType(product.productType);
  const summary = optionSummary(product);
  // Quick add only when there's no choice to make; otherwise go to the page.
  const singleVariant =
    product.variants.length === 1 && product.variants[0]?.availableForSale ? product.variants[0] : null;
  // "Sale" only when Shopify has a real compare-at price above the price.
  const saleVariant = product.variants.find(
    (v) => v.compareAtPrice && Number(v.compareAtPrice.amount) > Number(v.price.amount),
  );
  const hoverImage = product.images[1] ?? null;

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
        <ProductImage
          image={product.featuredImage}
          alt={product.title}
          priority={priority}
          sizes={SIZES}
          className="absolute inset-0 size-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {hoverImage && (
          <Image
            src={hoverImage.url}
            alt=""
            fill
            sizes={SIZES}
            className="hidden object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-fine:block"
          />
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          {!product.availableForSale && (
            <span className="rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">Sold out</span>
          )}
          {product.availableForSale && saleVariant && (
            <span className="rounded-full bg-lime px-2.5 py-1 text-xs font-medium text-lime-foreground">Sale</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-3">
        {category && (
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{category.label}</p>
        )}
        <Heading className="line-clamp-2 text-sm font-medium sm:text-base">
          <Link
            href={`/products/${product.handle}`}
            className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring"
          >
            {product.title}
          </Link>
        </Heading>
        <p className="flex flex-wrap items-baseline gap-x-2 font-semibold tabular-nums">
          <span>
            {hasRange && <span className="text-sm font-normal text-muted-foreground">From </span>}
            {formatMoney(minVariantPrice)}
          </span>
          {saleVariant?.compareAtPrice && (
            <span className="text-sm font-normal text-muted-foreground line-through">
              <span className="sr-only">Was </span>
              {formatMoney(saleVariant.compareAtPrice)}
            </span>
          )}
        </p>
        {summary && <p className="text-xs text-muted-foreground">{summary}</p>}
        <div className="mt-auto pt-3">
          {singleVariant ? (
            <QuickAdd variantId={singleVariant.id} title={product.title} />
          ) : product.availableForSale ? (
            // Visual only: the whole card already links to the product page.
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-full items-center justify-center rounded-full border border-input text-[0.8125rem] font-medium transition-colors group-hover:border-foreground"
            >
              Choose options
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
