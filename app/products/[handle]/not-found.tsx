import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-6 px-4 py-24 sm:px-8">
      <p className="text-eyebrow font-medium uppercase text-muted-foreground">Product not found</p>
      <h1 className="text-headline font-semibold">This product isn&apos;t available.</h1>
      <p className="max-w-lg text-lg text-muted-foreground">
        It may have been removed or the link may be wrong. Have a look at what&apos;s in the shop instead.
      </p>
      <Link href="/shop" className={buttonVariants()}>
        Back to the shop
      </Link>
    </main>
  );
}
