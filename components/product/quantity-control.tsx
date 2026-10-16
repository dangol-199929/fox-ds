"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stepper built from native buttons plus a read-only value, so it works with
 * touch, keyboard and screen readers without a custom widget.
 */
export function QuantityControl({
  value,
  min = 1,
  max,
  onChange,
  disabled,
  label,
  size = "default",
  className,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  /** What the quantity is for, e.g. "Clean Desk Kit". */
  label: string;
  size?: "default" | "sm";
  className?: string;
}) {
  const button =
    "grid place-items-center rounded-full text-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
  const dim = size === "sm" ? "size-9" : "size-11";

  return (
    <div
      role="group"
      aria-label={`Quantity for ${label}`}
      className={cn(
        "inline-flex items-center rounded-full border border-input bg-background",
        className,
      )}
    >
      <button
        type="button"
        className={cn(button, dim)}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label={value - 1 < 1 ? `Remove ${label}` : `Decrease quantity of ${label}`}
      >
        <MinusIcon className="size-4" aria-hidden="true" />
      </button>
      <output
        aria-live="polite"
        className={cn(
          "min-w-8 text-center font-medium tabular-nums",
          size === "sm" ? "text-sm" : "text-base",
        )}
      >
        {value}
      </output>
      <button
        type="button"
        className={cn(button, dim)}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label={`Increase quantity of ${label}`}
      >
        <PlusIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
