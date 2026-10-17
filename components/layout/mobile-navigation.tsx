"use client";

import { ChevronRightIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { mainNav, policyNav, siteConfig } from "@/lib/site";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}
      >
        <MenuIcon className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
          <Link
            href={`/products/${siteConfig.featuredProductHandle}`}
            onClick={close}
            className="mb-4 flex min-h-14 items-center justify-between rounded-lg bg-lime px-4 font-semibold text-lime-foreground"
          >
            The Clean Desk Kit
            <ChevronRightIcon className="size-5" aria-hidden="true" />
          </Link>
          <p className="mb-1 text-eyebrow font-medium uppercase text-muted-foreground">Shop</p>
          <ul className="divide-y divide-border">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="flex min-h-13 items-center justify-between text-lg font-medium tracking-tight"
                >
                  {item.label}
                  <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
            <li>
              <Link href="/account" onClick={close} className="flex min-h-13 items-center justify-between text-lg font-medium tracking-tight">
                Your account
                <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          </ul>
          <ul className="mt-auto space-y-1 pt-8 text-muted-foreground">
            <li>
              <Link href="/#faq" onClick={close} className="flex min-h-11 items-center">
                FAQ
              </Link>
            </li>
            {policyNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={close} className="flex min-h-11 items-center">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
