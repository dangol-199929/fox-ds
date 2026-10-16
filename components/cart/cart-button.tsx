"use client";

import { ShoppingBagIcon } from "lucide-react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useCart, useCartActions } from "./cart-context";

export function CartButton() {
  const { setOpen } = useCartActions();
  return (
    <Suspense fallback={<CartButtonView count={0} onClick={() => setOpen(true)} />}>
      <CartButtonWithCount onClick={() => setOpen(true)} />
    </Suspense>
  );
}

function CartButtonWithCount({ onClick }: { onClick: () => void }) {
  const cart = useCart();
  return <CartButtonView count={cart?.totalQuantity ?? 0} onClick={onClick} />;
}

function CartButtonView({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={count > 0 ? `Open cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart, empty"}
      className="relative"
    >
      <ShoppingBagIcon className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span
          key={count}
          aria-hidden="true"
          className="absolute top-1 right-0.5 grid h-5 min-w-5 animate-in place-items-center rounded-full border border-foreground bg-lime px-1 text-[0.6875rem] leading-none font-semibold text-lime-foreground tabular-nums zoom-in-50 duration-200"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  );
}
