import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-6 px-4 py-24 sm:px-8">
      <p className="text-eyebrow font-medium uppercase text-muted-foreground">404</p>
      <h1 className="text-headline font-semibold">This page has been tidied away.</h1>
      <p className="max-w-lg text-lg text-muted-foreground">
        We couldn&apos;t find what you were looking for.
      </p>
      <Link href="/" className={buttonVariants()}>
        Back to home
      </Link>
    </main>
  );
}
