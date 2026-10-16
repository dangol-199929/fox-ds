import { benefits } from "@/lib/content";

export function BenefitsSection() {
  return (
    <section aria-labelledby="benefits-heading">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-8 md:grid-cols-[1fr_1.4fr] lg:py-24">
        <div className="md:sticky md:top-24 md:self-start">
          <h2 id="benefits-heading" className="text-headline font-semibold">
            Why choose this kit?
          </h2>
          <p className="mt-4 max-w-sm text-muted-foreground">
            No gadgets you don&apos;t need. Just the basics for a desk that looks and feels calmer.
          </p>
        </div>
        <ul className="divide-y divide-foreground/15 border-y border-foreground/15">
          {benefits.map((benefit, i) => (
            <li key={benefit.title} className="grid gap-2 py-7 sm:grid-cols-[3rem_1fr]">
              <span className="text-sm font-medium tabular-nums text-muted-foreground" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight">{benefit.title}</h3>
                <p className="max-w-md text-muted-foreground">{benefit.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
