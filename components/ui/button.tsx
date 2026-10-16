import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Clean Desk Kit button. Pill-shaped, 44px tall by default for touch targets.
// The lime fill is reserved for primary calls to action and always carries
// charcoal text plus a charcoal edge, because lime alone has ~1.2:1 contrast
// against the off-white background.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-lime text-lime-foreground shadow-[0_2px_0_0_var(--foreground)] hover:-translate-y-px hover:shadow-[0_3px_0_0_var(--foreground)] active:translate-y-0.5 active:shadow-none",
        dark: "bg-primary text-primary-foreground hover:bg-primary/85",
        outline:
          "border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background aria-expanded:bg-foreground aria-expanded:text-background",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
        ghost:
          "text-foreground hover:bg-secondary aria-expanded:bg-secondary",
        destructive:
          "border-destructive/30 bg-transparent text-destructive hover:bg-destructive/10",
        link: "rounded-none text-foreground underline decoration-1 underline-offset-4 hover:decoration-2",
      },
      size: {
        default:
          "h-11 gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        sm: "h-9 gap-1.5 px-4 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-13 gap-2 px-8 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    // Text links keep a 44px hit area but no horizontal padding.
    compoundVariants: [{ variant: "link", className: "px-0 has-data-[icon]:px-0" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
