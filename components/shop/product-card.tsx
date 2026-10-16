import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/shopify/types";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const hasRange = minVariantPrice.amount !== maxVariantPrice.amount;

  return (
    <article className="group relative flex flex-col gap-4">
      <ProductImage
        image={product.featuredImage}
        alt={product.title}
        priority={priority}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-[4/5] w-full rounded-lg transition-transform duration-500 group-hover:scale-[1.01]"
      />
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">
          <Link href={`/products/${product.handle}`} className="after:absolute after:inset-0">
            {product.title}
          </Link>
        </h2>
        <p className="shrink-0 font-medium tabular-nums">
          {hasRange && <span className="text-sm text-muted-foreground">From </span>}
          {formatMoney(minVariantPrice)}
        </p>
      </div>
      {!product.availableForSale && (
        <p className="-mt-2 text-sm text-muted-foreground">Sold out</p>
      )}
    </article>
  );
}
