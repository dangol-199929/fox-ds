"use client";

import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { activeFilterCount, shopHref, type ShopParams } from "@/lib/shop-params";
import { type FilterGroup, SORT_OPTIONS, type SortValue } from "@/lib/shopify/search-options";
import { cn } from "@/lib/utils";

type Props = {
  groups: FilterGroup[];
  params: ShopParams;
  resultCount: number;
  showFilters: boolean;
  showSort: boolean;
};

/** Labels for the active-filter chips, from Shopify's own value labels. */
function activeChips(groups: FilterGroup[], params: ShopParams) {
  const labels = new Map<string, string>();
  for (const g of groups) for (const v of g.values) labels.set(v.id, `${g.label}: ${v.label}`);
  const chips = params.filterIds
    .filter((id) => labels.has(id))
    .map((id) => ({ key: id, label: labels.get(id)!, remove: { ...params, filterIds: params.filterIds.filter((f) => f !== id) } }));
  if (params.minPrice !== null || params.maxPrice !== null) {
    const min = params.minPrice !== null ? `$${params.minPrice}` : "$0";
    const max = params.maxPrice !== null ? `$${params.maxPrice}` : "any";
    chips.push({ key: "price", label: `Price: ${min} to ${max}`, remove: { ...params, minPrice: null, maxPrice: null } });
  }
  return chips;
}

export function ShopControls({ groups, params, resultCount, showFilters, showSort }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const count = activeFilterCount(params);
  const chips = activeChips(groups, params);

  const go = (next: ShopParams) =>
    startTransition(() => router.push(shopHref(next), { scroll: false }));
  const clearAll = () => go({ ...params, filterIds: [], minPrice: null, maxPrice: null });

  return (
    <div className="space-y-4" aria-busy={isPending}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground" role="status" aria-live="polite">
          {isPending ? "Updating…" : `${resultCount} ${resultCount === 1 ? "product" : "products"}`}
        </p>
        <div className="flex items-center gap-2">
          {showFilters && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger render={<Button variant="outline" className="lg:hidden" />}>
                <SlidersHorizontalIcon aria-hidden="true" />
                Filters{count > 0 && ` (${count})`}
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <FilterForm groups={groups} params={params} onChange={go} />
                </div>
                <SheetFooter>
                  <Button className="w-full" onClick={() => setSheetOpen(false)}>
                    Show {resultCount} {resultCount === 1 ? "product" : "products"}
                  </Button>
                  {count > 0 && (
                    <Button variant="link" className="self-center" onClick={clearAll}>
                      Clear all filters
                    </Button>
                  )}
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}
          {showSort && <SortSelect value={params.sort} onChange={(sort) => go({ ...params, sort })} />}
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={() => go(chip.remove)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-foreground bg-lime px-3 text-sm font-medium text-lime-foreground"
                aria-label={`Remove filter ${chip.label}`}
              >
                {chip.label}
                <XIcon className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
          <li>
            <Button variant="link" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          </li>
        </ul>
      )}
    </div>
  );
}

/** Desktop sidebar version of the filters. */
export function FilterSidebar({ groups, params }: { groups: FilterGroup[]; params: ShopParams }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  return (
    <aside aria-label="Filters" className="hidden lg:block">
      <FilterForm
        groups={groups}
        params={params}
        onChange={(next) => startTransition(() => router.push(shopHref(next), { scroll: false }))}
      />
    </aside>
  );
}

function SortSelect({ value, onChange }: { value: SortValue; onChange: (v: SortValue) => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        Sort
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="h-11 rounded-full border border-input bg-background pr-8 pl-4 text-sm font-medium"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterForm({
  groups,
  params,
  onChange,
}: {
  groups: FilterGroup[];
  params: ShopParams;
  onChange: (next: ShopParams) => void;
}) {
  return (
    <div className="space-y-8">
      {groups.map((group) =>
        group.type === "PRICE_RANGE" ? (
          <PriceFilter key={`${group.id}-${params.minPrice}-${params.maxPrice}`} group={group} params={params} onChange={onChange} />
        ) : (
          <fieldset key={group.id} className="space-y-1">
            <legend className="mb-2 text-eyebrow font-medium uppercase text-muted-foreground">{group.label}</legend>
            {group.values.map((value) => {
              const checked = params.filterIds.includes(value.id);
              const disabled = value.count === 0 && !checked;
              return (
                <label
                  key={value.id}
                  className={cn("flex min-h-11 cursor-pointer items-center gap-3", disabled && "cursor-not-allowed text-muted-foreground")}
                >
                  <input
                    type="checkbox"
                    className="size-5 accent-foreground"
                    checked={checked}
                    disabled={disabled}
                    onChange={() =>
                      onChange({
                        ...params,
                        filterIds: checked
                          ? params.filterIds.filter((id) => id !== value.id)
                          : [...params.filterIds, value.id],
                      })
                    }
                  />
                  <span className="flex-1">{value.label}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{value.count}</span>
                </label>
              );
            })}
          </fieldset>
        ),
      )}
    </div>
  );
}

function PriceFilter({
  group,
  params,
  onChange,
}: {
  group: FilterGroup;
  params: ShopParams;
  onChange: (next: ShopParams) => void;
}) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const read = (name: string) => {
      const raw = String(form.get(name) ?? "").trim();
      if (raw === "") return null;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? n : NaN;
    };
    const min = read("min");
    const max = read("max");
    if (Number.isNaN(min) || Number.isNaN(max)) {
      setError("Enter prices as numbers, 0 or more.");
      return;
    }
    if (min !== null && max !== null && min > max) {
      setError("The minimum can't be more than the maximum.");
      return;
    }
    setError(null);
    onChange({ ...params, minPrice: min, maxPrice: max });
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate aria-describedby={error ? `${id}-error` : undefined}>
      <p className="text-eyebrow font-medium uppercase text-muted-foreground">{group.label} (AUD)</p>
      <div className="flex items-end gap-2">
        <label className="flex-1 space-y-1 text-sm">
          <span>Min</span>
          <input
            name="min"
            inputMode="decimal"
            defaultValue={params.minPrice ?? ""}
            aria-invalid={Boolean(error)}
            className="h-11 w-full rounded-md border border-input bg-background px-3"
          />
        </label>
        <label className="flex-1 space-y-1 text-sm">
          <span>Max</span>
          <input
            name="max"
            inputMode="decimal"
            defaultValue={params.maxPrice ?? ""}
            aria-invalid={Boolean(error)}
            className="h-11 w-full rounded-md border border-input bg-background px-3"
          />
        </label>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
