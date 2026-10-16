import { Button } from "@/components/ui/button";

// Temporary holding page for the scaffold phase. It shows the brand tokens
// only; the real homepage (with live Shopify data) replaces it later.
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
      <p className="max-w-xl text-lg text-muted-foreground">
        Clean Desk Kit is being set up. Products, prices and checkout will come
        directly from Shopify once the store is connected.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled>Shop the Clean Desk Kit</Button>
        <Button variant="link" disabled>
          See the transformation
        </Button>
      </div>
    </main>
  );
}
