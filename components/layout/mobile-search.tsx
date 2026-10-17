"use client";

import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SearchForm } from "./search-form";

/** Search for small screens: an icon in the header that opens a search sheet. */
export function MobileSearch() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" />}>
        <SearchIcon className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Search</SheetTitle>
        </SheetHeader>
        <div className="px-5 pb-6">
          <SearchForm id="mobile-search" autoFocus onSubmit={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
