"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useCartActions } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";

/** One-tap add for products with a single purchasable variant only. */
export function QuickAdd({ variantId, title }: { variantId: string; title: string }) {
  const { add, pendingKey, isPending } = useCartActions();
  const adding = pendingKey === variantId;

  return (
    <Button
      size="sm"
      className="relative z-10 w-full"
      onClick={() => add(variantId, 1, title)}
      disabled={isPending}
      aria-label={`Add to cart: ${title}`}
    >
      {adding ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <PlusIcon aria-hidden="true" />}
      Add to cart
    </Button>
  );
}
