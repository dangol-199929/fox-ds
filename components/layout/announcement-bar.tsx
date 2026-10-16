// Brand line only. No shipping promises or discounts until they're real.
export function AnnouncementBar() {
  return (
    <div className="bg-foreground text-background">
      <p className="mx-auto max-w-7xl px-4 py-2 text-center text-xs font-medium tracking-wide sm:px-8">
        A cleaner desk starts here.{" "}
        <span className="hidden sm:inline">
          <span className="text-lime" aria-hidden="true">
            ●
          </span>{" "}
          <span className="text-background/75">Less cable chaos. More focus.</span>
        </span>
      </p>
    </div>
  );
}
