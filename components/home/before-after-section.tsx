// Side by side on desktop, stacked on mobile. Real photography isn't
// available yet, so both panels are clearly marked placeholders and no
// results are claimed.
export function BeforeAfterSection() {
  return (
    <section
      id="transformation"
      aria-labelledby="transformation-heading"
      className="scroll-mt-20 bg-foreground text-background"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="transformation-heading" className="max-w-xl text-headline font-semibold">
            From cable chaos to calm.
          </h2>
          <p className="max-w-sm text-background/70">
            The same desk, before and after a tidy-up. Real before-and-after photos are coming soon.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Panel label="Before" tone="before" />
          <Panel label="After" tone="after" />
        </div>
      </div>
    </section>
  );
}

function Panel({ label, tone }: { label: string; tone: "before" | "after" }) {
  return (
    <figure className="overflow-hidden rounded-lg bg-background/5 ring-1 ring-background/15">
      <div
        role="img"
        aria-label={`${label}: photo placeholder`}
        className="relative grid aspect-[4/3] place-items-center"
      >
        <svg aria-hidden="true" viewBox="0 0 400 300" className="absolute inset-0 size-full" fill="none" strokeLinecap="round">
          <rect x="30" y="200" width="340" height="10" rx="2" className="fill-background/40" />
          {tone === "before" ? (
            <g className="stroke-background/50" strokeWidth="3">
              <path d="M60 200 C 20 260, 140 120, 120 260 S 220 140, 200 270" />
              <path d="M120 200 C 180 280, 60 230, 260 250 S 300 150, 330 270" />
              <path d="M200 200 C 160 120, 320 300, 240 230 S 360 210, 350 280" />
              <path d="M300 200 C 340 260, 80 290, 150 240" />
            </g>
          ) : (
            <g strokeWidth="3">
              <path d="M120 210 C 120 240, 250 240, 360 240" className="stroke-background/60" />
              <path d="M200 210 C 200 232, 270 234, 360 234" className="stroke-background/60" />
              <path d="M300 210 C 300 226, 320 228, 360 228" className="stroke-background/60" />
              {[250, 290, 330].map((x) => (
                <rect key={x} x={x - 5} y="224" width="10" height="20" rx="3" className="fill-lime" />
              ))}
            </g>
          )}
        </svg>
        <span className="relative rounded-full bg-foreground/80 px-3 py-1 text-eyebrow font-medium uppercase text-background/80">
          Photo placeholder
        </span>
      </div>
      <figcaption className="flex items-center justify-between border-t border-background/15 px-4 py-3 text-sm">
        <span className="font-medium">{label}</span>
        {tone === "after" && (
          <span className="rounded-full bg-lime px-2 py-0.5 text-xs font-medium text-lime-foreground">
            With the kit
          </span>
        )}
      </figcaption>
    </figure>
  );
}
