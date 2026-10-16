import type { Metadata } from "next";
import { ProductCard } from "@/components/shop/product-card";
import { getProducts } from "@/lib/shopify/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop the Clean Desk Kit and desk organisation essentials. Prices in AUD.",
};

export default async function ShopPage() {
  const products = await getProducts({ first: 48 });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8 lg:py-16">
      <header className="mb-10 flex flex-col gap-3 border-b border-foreground/15 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-headline font-semibold">Shop</h1>
        <p className="text-muted-foreground" aria-live="polite">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </header>

      {products.length === 0 ? (
        <div className="flex flex-col items-start gap-3 py-16">
          <p className="text-xl font-medium">Nothing in the shop just yet.</p>
          <p className="text-muted-foreground">New products are on the way. Please check back soon.</p>
        </div>
      ) : (
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => (
            <li key={product.id}>
              <ProductCard product={product} priority={i < 3} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
