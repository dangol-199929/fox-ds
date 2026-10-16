import Link from "next/link";

/** Custom wordmark: a cable that ends in a lime plug. */
export function Wordmark() {
  return (
    <Link
      href="/"
      className="group inline-flex min-h-11 items-center gap-2 font-semibold tracking-tight"
      aria-label="Clean Desk Kit, home"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 20"
        className="h-5 w-8 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      >
        <path
          d="M2 15 C 8 15, 9 5, 16 5 S 22 10, 24 10"
          className="transition-[stroke-dashoffset] duration-500 [stroke-dasharray:40] group-hover:[stroke-dashoffset:-6] motion-reduce:transition-none"
        />
        <rect x="23" y="6" width="7" height="8" rx="2" className="fill-lime" />
      </svg>
      <span className="text-[1.0625rem] leading-none">
        clean<span className="text-muted-foreground">/</span>desk
      </span>
    </Link>
  );
}
