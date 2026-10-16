"use server";

import { z } from "zod";
import { CUSTOMER_UPDATE_MUTATION, CustomerAuthError, customerFetch } from "@/lib/customer-account/client";
import { isCustomerAccountConfigured } from "@/lib/customer-account/config";
import { isExpired, readSession, refreshSession, writeSession } from "@/lib/customer-account/session";

export type ProfileState =
  | { status: "idle" }
  | { status: "success"; message: string; firstName: string; lastName: string }
  | { status: "error"; message: string; fieldErrors?: { firstName?: string; lastName?: string } };

const name = z
  .string()
  .trim()
  .max(100, { error: "Keep it under 100 characters." })
  .regex(/^[^<>{}]*$/, { error: "Please remove special characters like < or >." });

const profileSchema = z.object({ firstName: name, lastName: name });

/** Updates the signed-in customer's own name in Shopify. */
export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  if (!isCustomerAccountConfigured()) return { status: "error", message: "Accounts aren't available right now." };

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName") ?? "",
    lastName: formData.get("lastName") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: { firstName?: string; lastName?: string } = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "firstName" | "lastName";
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }

  let session = await readSession();
  if (!session) return { status: "error", message: "Your session has ended. Please sign in again." };

  try {
    if (isExpired(session)) {
      session = await refreshSession(session);
      await writeSession(session);
    }
    const result = await customerFetch<{
      customerUpdate: {
        customer: { firstName: string | null; lastName: string | null } | null;
        userErrors: { field: string[] | null; message: string }[];
      };
    }>(session.accessToken, CUSTOMER_UPDATE_MUTATION, { input: parsed.data });

    if (result.customerUpdate.userErrors.length) {
      return { status: "error", message: result.customerUpdate.userErrors[0]!.message };
    }
    const saved = result.customerUpdate.customer;
    return {
      status: "success",
      message: "Your details have been saved.",
      firstName: saved?.firstName ?? "",
      lastName: saved?.lastName ?? "",
    };
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return { status: "error", message: "Your session has ended. Please sign in again." };
    }
    console.error("[account] profile update failed");
    return { status: "error", message: "We couldn't save your details. Please try again." };
  }
}
