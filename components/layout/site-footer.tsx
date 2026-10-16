import Link from "next/link";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";
import { policyNav, siteConfig } from "@/lib/site";
import { Wordmark } from "./wordmark";

export function SiteFooter() {
  const social = [
    { label: "Instagram", href: siteConfig.social.instagram },
    { label: "TikTok", href: siteConfig.social.tiktok },
  ].filter((s): s is { label: string; href: string } => Boolean(s.href));

  return (
    <footer className="mt-auto border-t border-foreground/10 bg-secondary">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Wordmark />
          <p className="max-w-xs text-sm text-muted-foreground">
            A simple kit for tidier cables and a calmer desk. Australian store, prices in AUD.
          </p>
          <div className="max-w-sm pt-4">
            <h2 className="mb-3 text-eyebrow font-medium uppercase text-muted-foreground">Newsletter</h2>
            <NewsletterSignup variant="compact" />
          </div>
        </div>
        <nav aria-label="Shop">
          <h2 className="text-eyebrow font-medium uppercase text-muted-foreground">Shop</h2>
          <ul className="mt-3">
            <li>
              <Link href="/shop" className="flex min-h-11 items-center hover:underline">
                All products
              </Link>
            </li>
            <li>
              <Link href={`/products/${siteConfig.featuredProductHandle}`} className="flex min-h-11 items-center hover:underline">
                Clean Desk Kit
              </Link>
            </li>
            {social.map((s) => (
              <li key={s.label}>
                <a href={s.href} className="flex min-h-11 items-center hover:underline" rel="noopener noreferrer" target="_blank">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Help and policies">
          <h2 className="text-eyebrow font-medium uppercase text-muted-foreground">Help</h2>
          <ul className="mt-3">
            {policyNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex min-h-11 items-center hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-foreground/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted-foreground sm:px-8">
          © Clean Desk Kit. Secure checkout by Shopify.
        </p>
      </div>
    </footer>
  );
}
