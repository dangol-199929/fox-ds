import { LockIcon, RotateCcwIcon, TruckIcon } from "lucide-react";
import Link from "next/link";
import { shippingConfig } from "@/lib/site";

/** Shipping, checkout and returns facts under the add-to-cart button. No delivery-time promises. */
export function ProductAssurances() {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border text-sm">
      {shippingConfig && (
        <li className="flex items-start gap-3 p-4">
          <TruckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium">Free shipping over ${shippingConfig.freeOver}.</span>{" "}
            <span className="text-muted-foreground">
              Otherwise ${shippingConfig.flatRate.toFixed(2)} flat, Australia-wide.{" "}
              <Link href="/shipping" className="underline underline-offset-4">
                Shipping details
              </Link>
            </span>
          </span>
        </li>
      )}
      <li className="flex items-start gap-3 p-4">
        <LockIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-medium">Secure checkout.</span>{" "}
          <span className="text-muted-foreground">Payments are handled by Shopify; we never see your card.</span>
        </span>
      </li>
      <li className="flex items-start gap-3 p-4">
        <RotateCcwIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-medium">Returns.</span>{" "}
          <span className="text-muted-foreground">
            See our{" "}
            <Link href="/refunds" className="underline underline-offset-4">
              returns and refunds policy
            </Link>
            . Australian Consumer Law rights always apply.
          </span>
        </span>
      </li>
    </ul>
  );
}
