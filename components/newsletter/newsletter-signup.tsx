"use client";

import { CheckIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useActionState, useId } from "react";
import { subscribeToNewsletter, type NewsletterState } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initial: NewsletterState = { status: "idle" };

/**
 * Newsletter form. Works without JavaScript (it's a plain form posting to a
 * Server Action) and never shows success unless Shopify saved the consent.
 */
export function NewsletterSignup({ variant = "section" }: { variant?: "section" | "compact" }) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initial);
  const id = useId();
  const compact = variant === "compact";
  const emailError = state.status === "error" && state.field === "email";
  const consentError = state.status === "error" && state.field === "consent";
  const values = state.status === "error" ? state.values : undefined;

  if (state.status === "success") {
    return (
      <p role="status" className={cn("flex items-start gap-3", compact ? "text-sm" : "text-lg")}>
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-foreground bg-lime">
          <CheckIcon className="size-3.5" aria-hidden="true" />
        </span>
        {state.message}
      </p>
    );
  }

  return (
    <form key={JSON.stringify(values ?? null)} action={action} noValidate className="space-y-3" aria-describedby={`${id}-privacy`}>
      <div className={cn("flex flex-col gap-3", !compact && "sm:flex-row sm:items-start")}>
        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor={`${id}-email`} className={cn("text-sm font-medium", compact && "sr-only")}>
            Email address
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={values?.email}
            placeholder="you@example.com"
            aria-invalid={emailError}
            aria-describedby={emailError ? `${id}-error` : undefined}
            className="h-11 w-full rounded-full border border-input bg-background px-5 text-base placeholder:text-muted-foreground/70 aria-invalid:border-destructive"
          />
        </div>
        <Button
          type="submit"
          disabled={pending}
          variant={compact ? "default" : "dark"}
          className={cn(!compact && "sm:mt-6")}
        >
          {pending && <Loader2Icon className="animate-spin" aria-hidden="true" />}
          {pending ? "Subscribing…" : "Subscribe"}
        </Button>
      </div>

      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input name="company" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          name="consent"
          type="checkbox"
          value="yes"
          required
          defaultChecked={values?.consent}
          aria-invalid={consentError}
          aria-describedby={consentError ? `${id}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 accent-foreground"
        />
        <span>Yes, email me desk setup ideas, product updates and occasional offers. Unsubscribe anytime.</span>
      </label>

      {state.status === "error" && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <p id={`${id}-privacy`} className="text-xs text-muted-foreground">
        We only use your email for these updates, separate from order emails. See our{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
