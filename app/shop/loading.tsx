export default function ShopLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8 lg:py-16" aria-busy="true">
      <div className="mb-10 h-14 w-48 animate-pulse rounded bg-secondary" />
      <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <li key={i} className="space-y-4">
            <div className="aspect-[4/5] animate-pulse rounded-lg bg-secondary" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-secondary" />
          </li>
        ))}
      </ul>
      <p className="sr-only">Loading products…</p>
    </main>
  );
}
