import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { getProduct } from "@/lib/shopify/products";

// Temporary holding page. The real homepage replaces it in the storefront
// phase; for now it proves product data flows from Shopify.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-10 px-4 py-20 sm:px-8">
      <p className="text-eyebrow font-medium uppercase text-muted-foreground">
        <span className="mr-2 inline-block rounded-full bg-lime px-2 py-0.5 text-lime-foreground">
          01
        </span>
        Store in progress
      </p>
      <h1 className="max-w-4xl text-display font-semibold">
        Your desk deserves better.
      </h1>
      <Suspense fallback={<p className="text-lg text-muted-foreground">Loading product…</p>}>
        <LiveProduct />
      </Suspense>
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled>Shop the Clean Desk Kit</Button>
        <Button variant="link" disabled>
          See the transformation
        </Button>
      </div>
    </main>
  );
}

async function LiveProduct() {
  let product;
  try {
    product = await getProduct("clean-desk-kit");
  } catch {
    return (
      <p className="max-w-xl text-lg text-muted-foreground">
        The store is being connected. Please check back soon.
      </p>
    );
  }

  if (!product) {
    return (
      <p className="max-w-xl text-lg text-muted-foreground">
        The Clean Desk Kit isn&apos;t available right now.
      </p>
    );
  }

  return (
    <p className="max-w-xl text-lg text-muted-foreground">
      <span className="font-medium text-foreground">{product.title}</span> ·{" "}
      {formatMoney(product.priceRange.minVariantPrice)}{" "}
      {product.availableForSale ? "· In stock" : "· Currently unavailable"}
    </p>
  );
}
