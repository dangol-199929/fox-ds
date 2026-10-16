import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountNavigation } from "@/components/account/account-navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { CUSTOMER_OVERVIEW_QUERY, CustomerAuthError, customerFetch, type CustomerOverview } from "@/lib/customer-account/client";
import { requireSession } from "@/lib/customer-account/current";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default function ProfilePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-8 lg:py-16">
      <Suspense fallback={<p className="text-muted-foreground">Loading your details…</p>}>
        <ProfileContent />
      </Suspense>
    </main>
  );
}

async function ProfileContent() {
  const session = await requireSession("/account/profile");
  let data: CustomerOverview;
  try {
    data = await customerFetch<CustomerOverview>(session.accessToken, CUSTOMER_OVERVIEW_QUERY);
  } catch (error) {
    if (error instanceof CustomerAuthError) redirect("/account/refresh?returnTo=%2Faccount%2Fprofile");
    throw error;
  }
  const { customer } = data;

  return (
    <div className="space-y-10">
      <h1 className="text-headline font-semibold">Profile</h1>
      <AccountNavigation current="/account/profile" />
      <ProfileForm
        firstName={customer.firstName ?? ""}
        lastName={customer.lastName ?? ""}
        email={customer.emailAddress?.emailAddress ?? null}
      />
      <section aria-labelledby="security-heading" className="max-w-md space-y-2 border-t border-foreground/15 pt-8">
        <h2 id="security-heading" className="text-lg font-semibold">
          Sign-in &amp; security
        </h2>
        <p className="text-muted-foreground">
          Your account has no password. Each time you sign in, Shopify emails you a one-time code,
          so there&apos;s no password to forget or change.
        </p>
      </section>
    </div>
  );
}
