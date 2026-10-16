export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-24" aria-busy="true">
      <span className="size-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </main>
  );
}
