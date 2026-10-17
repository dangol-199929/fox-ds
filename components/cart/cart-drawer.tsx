"use client";

import { Loader2Icon, LockIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ProductImage } from "@/components/product/product-image";
import { QuantityControl } from "@/components/product/quantity-control";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMoney } from "@/lib/format";
import { shippingConfig } from "@/lib/site";
import type { Cart, CartLine } from "@/lib/shopify/types";
import { useCart, useCartActions } from "./cart-context";

// Mirrors MAX_LINE_QUANTITY on the server, which enforces it regardless.
const MAX_QUANTITY = 20;

export function CartDrawer() {
  const { isOpen, setOpen, clearMessages } = useCartActions();

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) clearMessages();
      }}
    >
      <SheetContent side="right" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
          <SheetDescription className="sr-only">
            Review items, change quantities and continue to secure Shopify checkout.
          </SheetDescription>
        </SheetHeader>
        <Suspense fallback={<CartSkeleton />}>
          <CartBody />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}

function CartBody() {
  const cart = useCart();
  const { error, notice, setOpen } = useCartActions();

  return (
    <>
      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={
            error
              ? "mx-5 mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive"
              : "mx-5 mt-4 rounded-md border border-foreground/15 bg-secondary px-4 py-3"
          }
        >
          {error ?? notice}
        </div>
      )}

      {!cart || cart.lines.length === 0 ? (
        <EmptyCart onContinue={() => setOpen(false)} />
      ) : (
        <FilledCart cart={cart} />
      )}
    </>
  );
}

function EmptyCart({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-secondary">
        <ShoppingBagIcon className="size-6" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="text-lg font-medium">Your cart is empty</p>
        <p className="text-muted-foreground">Find something for your desk.</p>
      </div>
      <Link href="/shop" className={buttonVariants()} onClick={onContinue}>
        Start shopping
      </Link>
    </div>
  );
}

function FilledCart({ cart }: { cart: Cart }) {
  const { setOpen, checkout, isPending, pendingKey } = useCartActions();
  const checkingOut = pendingKey === "checkout";

  return (
    <>
      <FreeShippingMeter subtotal={Number(cart.cost.subtotalAmount.amount)} currencyCode={cart.cost.subtotalAmount.currencyCode} />
      <ul className="flex-1 divide-y divide-border overflow-y-auto px-5" aria-label="Items in your cart">
        {cart.lines.map((line) => (
          <CartLineItem key={line.id} line={line} />
        ))}
      </ul>

      <SheetFooter>
        <dl className="flex items-baseline justify-between text-base">
          <dt className="font-medium">Subtotal</dt>
          <dd className="text-lg font-semibold tabular-nums">{formatMoney(cart.cost.subtotalAmount)}</dd>
        </dl>
        <p className="text-sm text-muted-foreground">
          Shipping, taxes and any discounts are worked out at checkout.
        </p>
        <Button size="lg" className="w-full" onClick={checkout} disabled={isPending}>
          {checkingOut ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <LockIcon aria-hidden="true" />
          )}
          {checkingOut ? "Opening secure checkout…" : "Checkout"}
        </Button>
        <Button variant="link" className="self-center" onClick={() => setOpen(false)}>
          Continue shopping
        </Button>
      </SheetFooter>
    </>
  );
}

/**
 * Progress towards free shipping, from the rate mirrored in shippingConfig.
 * Shopify checkout applies the real rate; this is a guide only.
 */
function FreeShippingMeter({ subtotal, currencyCode }: { subtotal: number; currencyCode: string }) {
  if (!shippingConfig) return null;
  const { freeOver } = shippingConfig;
  const remaining = Math.max(freeOver - subtotal, 0);
  const progress = Math.min(subtotal / freeOver, 1);

  return (
    <div className="border-b border-border px-5 py-4">
      <p className="text-sm" role="status">
        {remaining > 0 ? (
          <>
            Add <strong className="tabular-nums">{formatMoney({ amount: remaining.toFixed(2), currencyCode })}</strong> more for
            free shipping.
          </>
        ) : (
          <strong>You qualify for free standard shipping.</strong>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
        <div
          className="h-full rounded-full bg-lime transition-[width] duration-500"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

function CartLineItem({ line }: { line: CartLine }) {
  const { setQuantity, remove, pendingKey, isPending } = useCartActions();
  const busy = pendingKey === line.id;
  const name = line.merchandise.product.title;
  const options = line.merchandise.selectedOptions.filter((o) => o.value !== "Default Title");

  return (
    <li className="flex gap-4 py-5" aria-busy={busy}>
      <Link
        href={`/products/${line.merchandise.product.handle}`}
        className="shrink-0"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage
          image={line.merchandise.image}
          alt={name}
          sizes="80px"
          className="size-20 rounded-md"
          placeholderLabel="Photo"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/products/${line.merchandise.product.handle}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              {name}
            </Link>
            {options.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {options.map((o) => `${o.name}: ${o.value}`).join(" · ")}
              </p>
            )}
            {!line.merchandise.availableForSale && (
              <p className="text-sm text-destructive">No longer available. Please remove it.</p>
            )}
          </div>
          <p className="shrink-0 font-medium tabular-nums">{formatMoney(line.cost.totalAmount)}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <QuantityControl
            size="sm"
            value={line.quantity}
            min={0}
            max={MAX_QUANTITY}
            label={name}
            disabled={isPending}
            onChange={(next) => setQuantity(line.id, next, name)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => remove(line.id, name)}
            disabled={isPending}
            aria-label={`Remove ${name} from cart`}
          >
            {busy ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2Icon aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </li>
  );
}

function CartSkeleton() {
  return (
    <div className="space-y-4 p-5" aria-hidden="true">
      {[0, 1].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="size-20 animate-pulse rounded-md bg-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-secondary" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}
