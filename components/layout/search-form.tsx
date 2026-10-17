import { SearchIcon } from "lucide-react";
import Form from "next/form";
import { cn } from "@/lib/utils";

/**
 * Product search. A plain GET form to /shop?q=…, so it works before
 * JavaScript loads; next/form adds client-side navigation on top.
 */
export function SearchForm({
  id,
  defaultValue,
  category,
  autoFocus = false,
  className,
  onSubmit,
}: {
  /** Unique per page: the header, mobile sheet and shop page each have one. */
  id: string;
  defaultValue?: string | null;
  /** Keep the shopper inside the category they're browsing. */
  category?: string | null;
  autoFocus?: boolean;
  className?: string;
  onSubmit?: () => void;
}) {
  return (
    <Form action="/shop" role="search" className={cn("relative", className)} onSubmit={onSubmit}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        type="search"
        name="q"
        defaultValue={defaultValue ?? ""}
        placeholder="Search desk accessories"
        autoComplete="off"
        maxLength={100}
        autoFocus={autoFocus}
        className="h-11 w-full rounded-full border border-input bg-background pr-12 pl-4 text-base placeholder:text-muted-foreground sm:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {category && <input type="hidden" name="category" value={category} />}
      <button
        type="submit"
        aria-label="Search"
        className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full transition-colors hover:bg-secondary"
      >
        <SearchIcon className="size-4" aria-hidden="true" />
      </button>
    </Form>
  );
}
