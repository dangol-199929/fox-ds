import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountNavigation } from "@/components/account/account-navigation";
import { formatOrderDate, orderStatus } from "@/components/account/status";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import {
  CUSTOMER_OVERVIEW_QUERY,
  CustomerAuthError,
  customerFetch,
  type CustomerOverview,
} from "@/lib/customer-account/client";
import { isCustomerAccountConfigured } from "@/lib/customer-account/config";
import { safeReturnTo } from "@/lib/customer-account/pkce";
import { isExpired, readSession } from "@/lib/customer-account/session";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

const ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled. You can try again any time.",
  expired: "Your sign-in timed out. Please try again.",
  signin: "We couldn't sign you in. Please try again.",
  unavailable: "Accounts aren't available right now.",
};

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-8 lg:py-16">
      <Suspense fallback={<p className="text-muted-foreground">Loading your account…</p>}>
        <AccountContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AccountContent({ searchParams }: { searchParams: PageProps<"/account">["searchParams"] }) {
  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : undefined;
  const returnTo = safeReturnTo(typeof params.returnTo === "string" ? params.returnTo : undefined);

  if (!isCustomerAccountConfigured()) {
    return (
      <div className="space-y-4">
        <h1 className="text-headline font-semibold">Your account</h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          Customer accounts are being set up. You don&apos;t need an account to order: checkout works
          as a guest, and your order emails include a link to track it.
        </p>
        <Link href="/shop" className={buttonVariants({ variant: "outline" })}>
          Continue shopping
        </Link>
      </div>
    );
  }

  const session = await readSession();
  if (!session) return <SignIn error={errorKey ? ERRORS[errorKey] : undefined} returnTo={returnTo} />;
  if (isExpired(session)) redirect("/account/refresh?returnTo=%2Faccount");

  let data: CustomerOverview;
  try {
    data = await customerFetch<CustomerOverview>(session.accessToken, CUSTOMER_OVERVIEW_QUERY);
  } catch (error) {
    if (error instanceof CustomerAuthError) redirect("/account/refresh?returnTo=%2Faccount");
    throw error;
  }

  const { customer } = data;
  const orders = customer.orders.nodes;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-eyebrow font-medium uppercase text-muted-foreground">Your account</p>
        <h1 className="text-headline font-semibold">
          {customer.firstName ? `Hi, ${customer.firstName}` : "Welcome back"}
        </h1>
        {customer.emailAddress?.emailAddress && (
          <p className="text-muted-foreground">Signed in as {customer.emailAddress.emailAddress}</p>
        )}
      </header>
      <AccountNavigation current="/account" />

      <section aria-labelledby="orders-heading" className="space-y-6">
        <h2 id="orders-heading" className="text-title font-semibold">
          Orders
        </h2>
        {orders.length === 0 ? (
          <div className="space-y-4 rounded-lg border border-foreground/15 bg-secondary p-6">
            <p className="text-lg">You haven&apos;t placed any orders yet.</p>
            <Link href="/shop" className={buttonVariants()}>
              Shop the kit
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-foreground/15 border-y border-foreground/15">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${encodeURIComponent(order.id.split("/").pop() ?? "")}`}
                  className="grid gap-1 py-5 transition-colors hover:bg-secondary/60 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:px-2"
                >
                  <span>
                    <span className="font-medium">Order {order.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {formatOrderDate(order.processedAt)} · {orderStatus(order)}
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">{formatMoney(order.totalPrice)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SignIn({ error, returnTo }: { error?: string; returnTo: string }) {
  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <h1 className="text-headline font-semibold">Sign in</h1>
      <p className="text-lg text-muted-foreground">
        No password needed. Enter your email on the next screen and we&apos;ll send you a 6-digit
        code. New here? The same step creates your account.
      </p>
      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
          {error}
        </p>
      )}
      <a
        href={`/account/login?returnTo=${encodeURIComponent(returnTo)}`}
        className={buttonVariants({ size: "lg", className: "w-full" })}
      >
        Continue with email
      </a>
      <p className="text-sm text-muted-foreground">
        Sign-in is handled securely by Shopify. Lost access to your email? Contact us and we&apos;ll
        help.
      </p>
      <Link href="/shop" className="inline-block text-sm font-medium underline underline-offset-4">
        Continue shopping
      </Link>
    </div>
  );
}
