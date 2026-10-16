import Image from "next/image";
import type { Image as ShopifyImage } from "@/lib/shopify/types";
import { cn } from "@/lib/utils";

/**
 * Shopify product image, or a clearly labelled placeholder while the store
 * has no photography yet. The placeholder never pretends to be a real photo.
 */
export function ProductImage({
  image,
  alt,
  sizes,
  priority = false,
  className,
  placeholderLabel = "Product photo coming soon",
}: {
  image: ShopifyImage | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  placeholderLabel?: string;
}) {
  if (!image) {
    return (
      <div
        role="img"
        aria-label={`${alt}: ${placeholderLabel.toLowerCase()}`}
        className={cn(
          "relative grid place-items-center overflow-hidden bg-secondary text-muted-foreground",
          className,
        )}
      >
        <CablePlaceholderArt />
        <span className="relative rounded-full bg-background/90 px-3 py-1 text-eyebrow font-medium uppercase">
          {placeholderLabel}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      <Image
        src={image.url}
        alt={image.altText || alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}

/** Decorative cable-line drawing used behind placeholders. */
function CablePlaceholderArt() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full text-foreground/15"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <path d="M-20 300 C 80 300, 90 160, 200 160 S 320 80, 420 80" />
      <path d="M-20 330 C 90 330, 110 200, 210 200 S 330 130, 420 130" />
      <path d="M-20 360 C 100 360, 130 240, 220 240 S 340 180, 420 180" />
      <circle cx="300" cy="104" r="9" className="fill-lime stroke-foreground/30" />
      <circle cx="318" cy="150" r="9" className="fill-lime stroke-foreground/30" />
      <circle cx="334" cy="196" r="9" className="fill-lime stroke-foreground/30" />
    </svg>
  );
}
