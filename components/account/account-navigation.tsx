import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const items = [
  { href: "/account", label: "Overview & orders" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountNavigation({ current }: { current: string }) {
  return (
    <nav aria-label="Account" className="flex flex-wrap items-center gap-2 border-b border-foreground/15 pb-6">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={current === item.href ? "page" : undefined}
          className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors hover:bg-secondary aria-[current=page]:bg-foreground aria-[current=page]:text-background"
        >
          {item.label}
        </Link>
      ))}
      <form action="/account/logout" method="post" className="ml-auto">
        <Button type="submit" variant="ghost" size="sm">
          <LogOutIcon aria-hidden="true" />
          Sign out
        </Button>
      </form>
    </nav>
  );
}
