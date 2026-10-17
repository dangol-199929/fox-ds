"use client";

import { CheckIcon, Loader2Icon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useCartActions } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { hasRealOptions } from "@/lib/shopify/reshape";
import type { Product } from "@/lib/shopify/types";
import { cn } from "@/lib/utils";
import {
  defaultVariant,
  findVariant,
  isOptionValueAvailable,
  selectionOf,
  type Selection,
} from "@/lib/variants";
import { QuantityControl } from "./quantity-control";

// Mirrors MAX_LINE_QUANTITY on the server, which enforces it regardless.
const MAX_QUANTITY = 20;

/**
 * Variant choice, quantity and add to cart. Price and availability always
 * come from the selected Shopify variant. On small screens a sticky bar
 * appears once the main button scrolls out of view.
 */
export function PurchasePanel({
  product,
  headingLevel = "h2",
  stickyBar = true,
}: {
  product: Product;
  headingLevel?: "h1" | "h2";
  /** Show the mobile sticky add-to-cart bar (product page only). */
  stickyBar?: boolean;
}) {
  const [selection, setSelection] = useState<Selection>(() => selectionOf(defaultVariant(product)));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { add, pendingKey, isPending, error } = useCartActions();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const errorId = useId();

  const variant = findVariant(product, selection);
  const available = Boolean(variant?.availableForSale);
  const adding = variant ? pendingKey === variant.id : false;
  const showOptions = hasRealOptions(product);
  const Title = headingLevel;

  useEffect(() => {
    const target = buttonRef.current;
    if (!target || !stickyBar) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry!.isIntersecting && entry!.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [stickyBar]);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 2500);
    return () => clearTimeout(timer);
  }, [added]);

  async function handleAdd() {
    if (!variant || !available) return;
    const ok = await add(variant.id, quantity, product.title);
    if (ok) setAdded(true);
  }

  const price = variant?.price ?? product.priceRange.minVariantPrice;
  const compareAt = variant?.compareAtPrice;
  const onSale = compareAt && Number(compareAt.amount) > Number(price.amount);

  const addButton = (extra?: string) => (
    <Button
      size="lg"
      className={cn("w-full", extra)}
      onClick={handleAdd}
      disabled={!available || isPending}
      aria-describedby={error ? errorId : undefined}
    >
      {adding ? (
        <Loader2Icon className="animate-spin" aria-hidden="true" />
      ) : added ? (
        <CheckIcon aria-hidden="true" />
      ) : null}
      {!variant
        ? "Unavailable"
        : !available
          ? "Sold out"
          : adding
            ? "Adding…"
            : added
              ? "Added to cart"
              : "Add to cart"}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3">
        <Title className="text-title font-semibold text-balance">{product.title}</Title>
        <p className="flex flex-wrap items-baseline gap-3 text-2xl font-medium tabular-nums">
          <span>{formatMoney(price)}</span>
          {onSale && (
            <span className="text-lg text-muted-foreground line-through">
              <span className="sr-only">Was </span>
              {formatMoney(compareAt)}
            </span>
          )}
          <span className="text-sm font-normal text-muted-foreground">{price.currencyCode}</span>
        </p>
      </div>

      {showOptions &&
        product.options.map((option) => (
          <fieldset key={option.name} className="space-y-3">
            <legend className="text-sm font-medium">
              {option.name}: <span className="text-muted-foreground">{selection[option.name]}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const id = `${option.name}-${value}`.replace(/\s+/g, "-");
                const valueAvailable = isOptionValueAvailable(product, selection, option.name, value);
                return (
                  <label
                    key={value}
                    htmlFor={id}
                    className={cn(
                      "relative inline-flex min-h-11 cursor-pointer items-center rounded-full border border-input px-5 text-sm font-medium transition-colors",
                      "has-checked:border-foreground has-checked:bg-foreground has-checked:text-background",
                      "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
                      !valueAvailable && "text-muted-foreground line-through decoration-1",
                    )}
                  >
                    <input
                      id={id}
                      type="radio"
                      name={option.name}
                      value={value}
                      checked={selection[option.name] === value}
                      onChange={() => setSelection((s) => ({ ...s, [option.name]: value }))}
                      className="sr-only"
                    />
                    {value}
                    {!valueAvailable && <span className="sr-only"> (sold out)</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

      {available && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Quantity</span>
          <QuantityControl
            value={quantity}
            max={MAX_QUANTITY}
            onChange={(next) => setQuantity(Math.min(Math.max(next, 1), MAX_QUANTITY))}
            label={product.title}
            disabled={isPending}
          />
        </div>
      )}

      <div ref={buttonRef} className="space-y-3">
        {addButton()}
        {!variant && (
          <p className="text-sm text-muted-foreground">This combination isn&apos;t available.</p>
        )}
        {variant && !available && (
          <p className="text-sm text-muted-foreground">
            This option is currently sold out. Check back soon.
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Mobile sticky bar. The page reserves space for it so content isn't covered. */}
      {stickyBar && (
      <div
        aria-hidden={!showStickyBar}
        inert={!showStickyBar}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-foreground/10 bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm transition-transform duration-200 md:hidden",
          showStickyBar ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{product.title}</p>
            <p className="text-sm text-muted-foreground tabular-nums">{formatMoney(price)}</p>
          </div>
          <div className="w-44 shrink-0">{addButton()}</div>
        </div>
      </div>
      )}
    </div>
  );
}
