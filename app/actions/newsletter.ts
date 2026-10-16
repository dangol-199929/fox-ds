"use server";

import { headers } from "next/headers";
import { emailSchema, subscribeEmail } from "@/lib/newsletter";
import { createRateLimiter } from "@/lib/rate-limit";
import { isShopifyError } from "@/lib/shopify/errors";

export type NewsletterState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message: string;
      field?: "email" | "consent";
      /** Echoed back so the form keeps what the visitor typed. */
      values?: { email: string; consent: boolean };
    };

// 5 attempts per client per 10 minutes.
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

// Same message whether the address is new or already subscribed, so the form
// can't be used to find out who is on the list.
const SUCCESS = "Thanks, you're on the list. Check your inbox for our next update.";

async function clientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

export async function subscribeToNewsletter(
  _previous: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  // Honeypot: real people never see or fill this field.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { status: "success", message: SUCCESS };
  }

  const values = {
    email: String(formData.get("email") ?? "").slice(0, 254),
    consent: formData.get("consent") === "yes",
  };
  const email = emailSchema.safeParse(values.email);
  if (!email.success) {
    return { status: "error", field: "email", message: "Enter a valid email address, like name@example.com.", values };
  }
  if (!values.consent) {
    return { status: "error", field: "consent", message: "Tick the box to confirm you'd like our emails.", values };
  }

  if (!limiter(await clientKey()).allowed) {
    return { status: "error", message: "Too many attempts. Please wait a few minutes and try again.", values };
  }

  try {
    await subscribeEmail(email.data);
    return { status: "success", message: SUCCESS };
  } catch (error) {
    // Log the failure kind only: Shopify messages can echo the email address.
    console.error(`[newsletter] subscribe failed - ${isShopifyError(error) ? error.kind : "unexpected error"}`);
    return {
      status: "error",
      message: isShopifyError(error) ? error.publicMessage : "Something went wrong. Please try again.",
      values,
    };
  }
}
