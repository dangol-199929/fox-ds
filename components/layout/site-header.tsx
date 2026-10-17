import { UserIcon } from "lucide-react";
import Link from "next/link";
import { CartButton } from "@/components/cart/cart-button";
import { mainNav, siteConfig } from "@/lib/site";
import { MobileNavigation } from "./mobile-navigation";
import { MobileSearch } from "./mobile-search";
import { SearchForm } from "./search-form";
import { Wordmark } from "./wordmark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-1 sm:gap-1 sm:px-6 md:gap-6 md:px-8">
        <MobileNavigation />
        <Wordmark />
        <SearchForm id="header-search" className="mx-auto hidden w-full max-w-lg md:block" />
        <div className="ml-auto flex items-center md:ml-0">
          <MobileSearch />
          <Link
            href="/account"
            aria-label="Your account"
            className="grid size-11 place-items-center rounded-full transition-colors hover:bg-secondary"
          >
            <UserIcon className="size-5" aria-hidden="true" />
          </Link>
          <CartButton />
        </div>
      </div>
      <nav aria-label="Categories" className="hidden border-t border-foreground/10 md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-6 md:px-8">
          <ul className="-ml-3 flex flex-1 items-center gap-1 overflow-x-auto">
            {mainNav.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={`/products/${siteConfig.featuredProductHandle}`}
            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full bg-lime px-3 text-sm font-medium text-lime-foreground transition-colors hover:bg-lime/80"
          >
            The Clean Desk Kit
          </Link>
        </div>
      </nav>
    </header>
  );
}
