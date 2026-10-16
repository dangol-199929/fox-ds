import { howItWorks } from "@/lib/content";

const icons = [
  // box
  <path key="0" d="M6 14 L24 6 L42 14 V34 L24 42 L6 34 Z M6 14 L24 22 L42 14 M24 22 V42" />,
  // routed cables
  <path key="1" d="M6 34 C 16 34, 16 14, 26 14 H 42 M6 40 C 18 40, 20 22, 30 22 H 42" />,
  // tidy desk
  <path key="2" d="M4 30 H 44 M10 30 V 42 M38 30 V 42 M16 30 V 14 H 32 V 30" />,
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-20 border-y border-foreground/10 bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-24">
        <h2 id="how-heading" className="max-w-xl text-headline font-semibold">
          How it works
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {howItWorks.map((step, i) => (
            <li key={step.title} className="relative flex flex-col gap-4 border-t border-foreground pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 48 48"
                  className="size-12 stroke-foreground"
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {icons[i]}
                  <circle cx="40" cy="8" r="4" className="fill-lime stroke-none" />
                </svg>
              </div>
              <h3 className="text-title font-semibold">{step.title}</h3>
              <p className="max-w-xs text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
