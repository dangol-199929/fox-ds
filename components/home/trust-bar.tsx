import { LockIcon, MapPinIcon, RotateCcwIcon, TruckIcon } from "lucide-react";
import Link from "next/link";
import { shippingConfig } from "@/lib/site";

// Facts only: each line matches a Shopify setting or a published policy page.
export function TrustBar() {
  const items = [
    shippingConfig && {
      icon: TruckIcon,
      title: `Free shipping over $${shippingConfig.freeOver}`,
      body: `Flat $${shippingConfig.flatRate.toFixed(2)} Australia-wide under that`,
      href: "/shipping",
    },
    { icon: LockIcon, title: "Secure checkout", body: "Payments handled by Shopify", href: null },
    { icon: MapPinIcon, title: "Australian store", body: "Prices in AUD", href: null },
    { icon: RotateCcwIcon, title: "Returns & refunds", body: "Read our policy", href: "/refunds" },
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <section aria-label="Why shop with us" className="border-y border-foreground/10 bg-secondary">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-6 px-4 py-7 sm:px-8 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, body, href }) => {
          const content = (
            <>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-background">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-sm text-muted-foreground">{body}</span>
              </span>
            </>
          );
          return (
            <li key={title}>
              {href ? (
                <Link href={href} className="flex items-start gap-3 hover:[&_span.block:last-child]:underline">
                  {content}
                </Link>
              ) : (
                <div className="flex items-start gap-3">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
