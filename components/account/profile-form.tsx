"use client";

import { Loader2Icon } from "lucide-react";
import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/actions/account";
import { Button } from "@/components/ui/button";

export function ProfileForm({ firstName, lastName, email }: { firstName: string; lastName: string; email: string | null }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, { status: "idle" });
  const values =
    state.status === "success" ? { firstName: state.firstName, lastName: state.lastName } : { firstName, lastName };
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={action} className="max-w-md space-y-5" noValidate>
      {(["firstName", "lastName"] as const).map((field) => (
        <div key={field} className="space-y-1">
          <label htmlFor={field} className="text-sm font-medium">
            {field === "firstName" ? "First name" : "Last name"}
          </label>
          <input
            id={field}
            name={field}
            defaultValue={values[field]}
            key={`${field}-${values[field]}`}
            autoComplete={field === "firstName" ? "given-name" : "family-name"}
            maxLength={100}
            aria-invalid={Boolean(errors?.[field])}
            aria-describedby={errors?.[field] ? `${field}-error` : undefined}
            className="h-11 w-full rounded-md border border-input bg-background px-3 aria-invalid:border-destructive"
          />
          {errors?.[field] && (
            <p id={`${field}-error`} className="text-sm text-destructive">
              {errors[field]}
            </p>
          )}
        </div>
      ))}
      <div className="space-y-1">
        <p className="text-sm font-medium">Email</p>
        <p className="text-muted-foreground">{email ?? "Not available"}</p>
        <p className="text-xs text-muted-foreground">
          Your email is how you sign in. To change it, contact us.
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" aria-hidden="true" />}
        {pending ? "Saving…" : "Save details"}
      </Button>
      {state.status !== "idle" && (
        <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-sm text-destructive" : "text-sm"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
