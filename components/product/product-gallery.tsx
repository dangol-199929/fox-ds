"use client";

import Image from "next/image";
import { useState } from "react";
import type { Image as ShopifyImage } from "@/lib/shopify/types";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";

/**
 * Main image plus thumbnails. Thumbnails are real buttons, so the gallery
 * works with keyboard and touch; on phones they scroll sideways.
 */
export function ProductGallery({ images, title }: { images: ShopifyImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <ProductImage
        image={current}
        alt={title}
        priority
        sizes="(min-width: 1024px) 55vw, 100vw"
        className="aspect-square w-full rounded-lg"
      />
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Product images">
          {images.map((image, i) => (
            <li key={image.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === index}
                className={cn(
                  "relative block size-18 overflow-hidden rounded-md border-2 transition-colors",
                  i === index ? "border-foreground" : "border-transparent hover:border-foreground/30",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
