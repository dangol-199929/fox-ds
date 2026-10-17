import Link from "next/link";
import { shippingConfig } from "@/lib/site";

// Only facts that match Shopify's settings: the shipping rate (see
// shippingConfig) and Shopify-hosted checkout. No delivery-time promises.
export function AnnouncementBar() {
  return (
    <div className="bg-foreground text-background">
      <p className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2 text-center text-xs font-medium tracking-wide sm:px-8">
        {shippingConfig ? (
          <Link href="/shipping" className="underline-offset-4 hover:underline">
            <span className="text-lime" aria-hidden="true">
              ●{" "}
            </span>
            Free shipping on orders over ${shippingConfig.freeOver}
            <span className="hidden sm:inline">
              <span className="text-background/75"> · Flat ${shippingConfig.flatRate.toFixed(2)} Australia-wide under that</span>
            </span>
          </Link>
        ) : (
          <span>A cleaner desk starts here.</span>
        )}
        <span className="hidden text-background/75 md:inline" aria-hidden="true">
          |
        </span>
        <span className="hidden text-background/75 md:inline">Secure checkout by Shopify</span>
      </p>
    </div>
  );
}
