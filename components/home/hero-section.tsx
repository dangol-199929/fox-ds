import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-16 sm:px-8 md:grid-cols-[1.1fr_1fr] md:gap-8 md:pt-16 md:pb-24">
        <div className="relative z-10 flex flex-col items-start gap-6">
          <p className="flex items-center gap-2 text-eyebrow font-medium uppercase text-muted-foreground">
            <span className="rounded-full bg-lime px-2 py-0.5 text-lime-foreground">01</span>
            The cable-management kit
          </p>
          <h1 id="hero-heading" className="text-display font-semibold text-balance">
            Your desk deserves better.
          </h1>
          <p className="max-w-md text-lg text-muted-foreground sm:text-xl">
            One simple kit to tame cable chaos and make your workspace feel put together.
          </p>
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
            <Link
              href={`/products/${siteConfig.featuredProductHandle}`}
              className={buttonVariants({ size: "lg" })}
            >
              Shop the Clean Desk Kit
            </Link>
            <Link href="#transformation" className={buttonVariants({ variant: "link", className: "self-center" })}>
              See the transformation
            </Link>
          </div>
        </div>
        <HeroArt />
      </div>
    </section>
  );
}

/**
 * Art-directed illustration of a tidy desk (not a product photo). It stands
 * in until real photography exists and is labelled as an illustration.
 */
function HeroArt() {
  return (
    <figure className="relative">
      <div className="relative aspect-[5/4] overflow-hidden rounded-lg bg-secondary">
        <svg
          viewBox="0 0 500 400"
          role="img"
          aria-label="Illustration of a tidy desk with cables neatly routed to one point"
          className="absolute inset-0 size-full"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* desk */}
          <rect x="40" y="250" width="420" height="16" rx="3" className="fill-foreground" />
          <rect x="70" y="266" width="10" height="110" className="fill-foreground/80" />
          <rect x="420" y="266" width="10" height="110" className="fill-foreground/80" />
          {/* monitor */}
          <rect x="150" y="90" width="200" height="120" rx="8" className="fill-background stroke-foreground" strokeWidth="4" />
          <rect x="240" y="210" width="20" height="40" className="fill-foreground" />
          <rect x="210" y="244" width="80" height="6" rx="3" className="fill-foreground" />
          {/* lamp */}
          <path d="M395 250 V 170 L 370 140" className="stroke-foreground" strokeWidth="4" />
          <path d="M352 132 L 388 120 L 380 150 Z" className="fill-lime stroke-foreground" strokeWidth="3" />
          {/* keyboard and mug */}
          <rect x="170" y="232" width="110" height="12" rx="4" className="fill-background stroke-foreground" strokeWidth="3" />
          <rect x="100" y="222" width="26" height="28" rx="4" className="fill-background stroke-foreground" strokeWidth="3" />
          {/* routed cables, bundled under the desk */}
          <g className="stroke-foreground hero-cable" strokeWidth="3">
            <path d="M250 250 C 250 290, 300 296, 330 296 H 420" />
            <path d="M395 250 C 395 284, 380 300, 360 300 H 420" />
            <path d="M113 250 C 113 288, 200 304, 300 304 H 420" />
          </g>
          {/* cable clips */}
          {[300, 340, 380].map((x) => (
            <rect key={x} x={x - 6} y="290" width="12" height="20" rx="3" className="fill-lime stroke-foreground" strokeWidth="2.5" />
          ))}
        </svg>
        <span className="absolute top-3 left-3 rounded-full bg-background/90 px-3 py-1 text-eyebrow font-medium uppercase text-muted-foreground">
          Illustration
        </span>
      </div>
      <figcaption className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-foreground/20" aria-hidden="true" />
        Cables routed, bundled and out of sight
      </figcaption>
    </figure>
  );
}
