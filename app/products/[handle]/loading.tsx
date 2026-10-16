export default function ProductLoading() {
  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-8 md:grid-cols-[1.15fr_1fr] md:gap-12 lg:gap-20" aria-busy="true">
      <div className="aspect-[4/5] animate-pulse rounded-lg bg-secondary sm:aspect-square" aria-hidden="true" />
      <div className="space-y-5" aria-hidden="true">
        <div className="h-14 w-3/4 animate-pulse rounded bg-secondary" />
        <div className="h-8 w-1/4 animate-pulse rounded bg-secondary" />
        <div className="h-13 w-full animate-pulse rounded-full bg-secondary" />
      </div>
      <p className="sr-only">Loading product…</p>
    </main>
  );
}
