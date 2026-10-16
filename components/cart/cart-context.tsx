"use client";

import {
  createContext,
  use,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  addToCart,
  goToCheckout,
  removeFromCart,
  updateCartQuantity,
  type CartActionResult,
} from "@/app/actions/cart";
import type { Cart } from "@/lib/shopify/types";

/**
 * Client cart state. The source of truth is always Shopify: the initial cart
 * is read on the server, and every change goes through a Server Action that
 * returns the cart as Shopify now has it. Nothing here is invented locally.
 */

type CartContextValue = {
  cartPromise: Promise<Cart | null>;
  /** Cart returned by the latest action; undefined until the first change. */
  latest: Cart | null | undefined;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  isPending: boolean;
  /** Line or variant currently being changed, for per-item spinners. */
  pendingKey: string | null;
  error: string | null;
  notice: string | null;
  /** Polite screen-reader announcement of the last change. */
  announcement: string;
  add: (variantId: string, quantity: number, label: string) => Promise<boolean>;
  setQuantity: (lineId: string, quantity: number, label: string) => void;
  remove: (lineId: string, label: string) => void;
  checkout: () => void;
  clearMessages: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  cartPromise,
  children,
}: {
  cartPromise: Promise<Cart | null>;
  children: ReactNode;
}) {
  const [latest, setLatest] = useState<Cart | null | undefined>(undefined);
  const [isOpen, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const apply = useCallback((result: CartActionResult, success: string) => {
    if (!result.ok) {
      setError(result.error);
      setNotice(null);
      setAnnouncement(result.error);
      return false;
    }
    setLatest(result.cart);
    setError(null);
    // Shopify reduces quantities to available stock and says so; show it.
    const warning = result.warnings[0]?.message ?? null;
    setNotice(warning);
    setAnnouncement(warning ?? success);
    return true;
  }, []);

  const add = useCallback(
    (variantId: string, quantity: number, label: string) =>
      new Promise<boolean>((resolve) => {
        setPendingKey(variantId);
        startTransition(async () => {
          const ok = apply(
            await addToCart({ variantId, quantity }),
            `Added ${quantity} × ${label} to your cart.`,
          );
          setPendingKey(null);
          if (ok) setOpen(true);
          resolve(ok);
        });
      }),
    [apply],
  );

  const setQuantity = useCallback(
    (lineId: string, quantity: number, label: string) => {
      setPendingKey(lineId);
      startTransition(async () => {
        apply(
          await updateCartQuantity({ lineId, quantity }),
          quantity === 0 ? `Removed ${label}.` : `${label} quantity is now ${quantity}.`,
        );
        setPendingKey(null);
      });
    },
    [apply],
  );

  const remove = useCallback(
    (lineId: string, label: string) => {
      setPendingKey(lineId);
      startTransition(async () => {
        apply(await removeFromCart({ lineId }), `Removed ${label}.`);
        setPendingKey(null);
      });
    },
    [apply],
  );

  const checkout = useCallback(() => {
    setPendingKey("checkout");
    startTransition(async () => {
      // On success the action redirects to Shopify checkout and never returns.
      const result = await goToCheckout();
      if (result && !result.ok) apply(result, "");
      setPendingKey(null);
    });
  }, [apply]);

  const clearMessages = useCallback(() => {
    setError(null);
    setNotice(null);
  }, []);

  const value = useMemo(
    () => ({
      cartPromise,
      latest,
      isOpen,
      setOpen,
      isPending,
      pendingKey,
      error,
      notice,
      announcement,
      add,
      setQuantity,
      remove,
      checkout,
      clearMessages,
    }),
    [cartPromise, latest, isOpen, isPending, pendingKey, error, notice, announcement, add, setQuantity, remove, checkout, clearMessages],
  );

  return (
    <CartContext value={value}>
      {children}
      <p aria-live="polite" role="status" className="sr-only">
        {announcement}
      </p>
    </CartContext>
  );
}

export function useCartActions() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCartActions must be used inside <CartProvider>");
  return context;
}

/** Current cart. Suspends until the server's initial cart arrives. */
export function useCart(): Cart | null {
  const { cartPromise, latest } = useCartActions();
  const initial = use(cartPromise);
  return latest === undefined ? initial : latest;
}
