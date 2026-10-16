import "server-only";
import { z } from "zod";
import { adminFetch } from "@/lib/shopify/admin";
import { ShopifyError } from "@/lib/shopify/errors";

/**
 * Newsletter subscriptions are stored as Shopify customers with email
 * marketing consent, so Shopify Email (or any Shopify-connected email tool)
 * can send to them, and Shopify handles unsubscribes. There is no separate
 * mailing-list database.
 *
 * Consent is recorded as SINGLE_OPT_IN from an explicit, clearly labelled
 * form. Existing customers are only ever moved *to* subscribed here when they
 * ask to be; this code never unsubscribes or changes anyone else.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email());

const CUSTOMER_BY_EMAIL = /* GraphQL */ `
  query CustomerByEmail($email: String!) {
    customerByIdentifier(identifier: { emailAddress: $email }) {
      id
      emailMarketingConsent {
        marketingState
      }
    }
  }
`;

const CUSTOMER_CREATE = /* GraphQL */ `
  mutation NewsletterCustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CONSENT_UPDATE = /* GraphQL */ `
  mutation NewsletterConsentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type UserErrors = { field: string[] | null; message: string }[];

function consent(now: Date) {
  return {
    marketingState: "SUBSCRIBED",
    marketingOptInLevel: "SINGLE_OPT_IN",
    consentUpdatedAt: now.toISOString(),
  };
}

function failIfErrors(errors: UserErrors, step: string) {
  if (errors.length) {
    // Field names only: Shopify's messages can echo the email address.
    const fields = errors.map((e) => e.field?.join(".") ?? "unknown").join(", ");
    throw new ShopifyError(
      `Newsletter ${step} rejected by Shopify (fields: ${fields})`,
      "user",
      "We couldn't add you right now. Please check your email address and try again.",
    );
  }
}

export type SubscribeOutcome = "created" | "updated" | "already_subscribed";

export async function subscribeEmail(email: string, now = new Date()): Promise<SubscribeOutcome> {
  const lookup = await adminFetch<{
    customerByIdentifier: { id: string; emailMarketingConsent: { marketingState: string } | null } | null;
  }>(CUSTOMER_BY_EMAIL, { email });

  const existing = lookup.customerByIdentifier;
  if (existing) {
    if (existing.emailMarketingConsent?.marketingState === "SUBSCRIBED") return "already_subscribed";
    const result = await adminFetch<{ customerEmailMarketingConsentUpdate: { userErrors: UserErrors } }>(
      CONSENT_UPDATE,
      { input: { customerId: existing.id, marketingConsent: consent(now) } },
    );
    failIfErrors(result.customerEmailMarketingConsentUpdate.userErrors, "consent update");
    return "updated";
  }

  const created = await adminFetch<{ customerCreate: { userErrors: UserErrors } }>(CUSTOMER_CREATE, {
    input: { email, emailMarketingConsent: consent(now), tags: ["newsletter"] },
  });
  failIfErrors(created.customerCreate.userErrors, "customer create");
  return "created";
}
