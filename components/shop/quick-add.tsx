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
      variant="outline"
      size="sm"
      className="relative z-10 bg-background"
      onClick={() => add(variantId, 1, title)}
      disabled={isPending}
      aria-label={`Add ${title} to cart`}
    >
      {adding ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <PlusIcon aria-hidden="true" />}
      Add
    </Button>
  );
}
