import Link from "next/link";
import { CartButton } from "@/components/cart/cart-button";
import { mainNav } from "@/lib/site";
import { MobileNavigation } from "./mobile-navigation";
import { Wordmark } from "./wordmark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-2 sm:px-6 md:px-8">
        <MobileNavigation />
        <Wordmark />
        <nav aria-label="Main" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto md:ml-2">
          <CartButton />
        </div>
      </div>
    </header>
  );
}
