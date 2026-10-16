"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-6 px-4 py-24 sm:px-8">
      <p className="text-eyebrow font-medium uppercase text-muted-foreground">Something went wrong</p>
      <h1 className="text-headline font-semibold">We couldn&apos;t load this page.</h1>
      <p role="alert" className="max-w-lg text-lg text-muted-foreground">
        The store may be briefly unavailable. Please try again. Your cart is safe.
      </p>
      <div className="flex flex-wrap gap-4">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Go home
        </Link>
      </div>
    </main>
  );
}
