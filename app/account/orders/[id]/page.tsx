import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountNavigation } from "@/components/account/account-navigation";
import { formatOrderDate, orderStatus } from "@/components/account/status";
import { formatMoney } from "@/lib/format";
import { CUSTOMER_ORDER_QUERY, CustomerAuthError, customerFetch, type CustomerOrder } from "@/lib/customer-account/client";
import { requireSession } from "@/lib/customer-account/current";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default function OrderPage({ params }: PageProps<"/account/orders/[id]">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-8 lg:py-16">
      <Suspense fallback={<p className="text-muted-foreground">Loading your order…</p>}>
        <OrderContent params={params} />
      </Suspense>
    </main>
  );
}

async function OrderContent({ params }: { params: PageProps<"/account/orders/[id]">["params"] }) {
  const { id } = await params;
  // Only plain numeric order ids; the API also checks the order is this customer's.
  if (!/^\d{1,20}$/.test(id)) notFound();
  const path = `/account/orders/${id}`;
  const session = await requireSession(path);

  let data: CustomerOrder;
  try {
    data = await customerFetch<CustomerOrder>(session.accessToken, CUSTOMER_ORDER_QUERY, {
      id: `gid://shopify/Order/${id}`,
    });
  } catch (error) {
    if (error instanceof CustomerAuthError) redirect(`/account/refresh?returnTo=${encodeURIComponent(path)}`);
    throw error;
  }
  const order = data.order;
  if (!order) notFound();

  const tracking = order.fulfillments.nodes.flatMap((f) => f.trackingInformation).filter((t) => t.number);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <Link href="/account" className="text-sm text-muted-foreground underline underline-offset-4">
          ← All orders
        </Link>
        <h1 className="text-headline font-semibold">Order {order.name}</h1>
        <p className="text-muted-foreground">
          {formatOrderDate(order.processedAt)} · {orderStatus(order)}
        </p>
      </header>
      <AccountNavigation current="" />

      <section aria-labelledby="items-heading">
        <h2 id="items-heading" className="mb-4 text-title font-semibold">
          Items
        </h2>
        <ul className="divide-y divide-foreground/15 border-y border-foreground/15">
          {order.lineItems.nodes.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-4">
              <span>
                {item.title}
                {item.variantTitle && <span className="block text-sm text-muted-foreground">{item.variantTitle}</span>}
                <span className="block text-sm text-muted-foreground">Qty {item.quantity}</span>
              </span>
              {item.totalPrice && <span className="tabular-nums">{formatMoney(item.totalPrice)}</span>}
            </li>
          ))}
        </ul>
        <dl className="mt-4 ml-auto max-w-xs space-y-2 text-sm">
          {order.subtotal && <Row label="Subtotal" value={formatMoney(order.subtotal)} />}
          <Row label="Shipping" value={formatMoney(order.totalShipping)} />
          {order.totalTax && <Row label="Tax" value={formatMoney(order.totalTax)} />}
          <Row label="Total" value={formatMoney(order.totalPrice)} strong />
        </dl>
      </section>

      <section aria-labelledby="tracking-heading" className="space-y-3">
        <h2 id="tracking-heading" className="text-title font-semibold">
          Tracking
        </h2>
        {tracking.length === 0 ? (
          <p className="text-muted-foreground">
            Tracking appears here once your order has shipped. We&apos;ll also email it to you.
          </p>
        ) : (
          <ul className="space-y-2">
            {tracking.map((t) => (
              <li key={t.number}>
                {t.company && <span className="font-medium">{t.company}: </span>}
                {t.url ? (
                  <a href={t.url} className="underline underline-offset-4" rel="noopener noreferrer" target="_blank">
                    {t.number}
                  </a>
                ) : (
                  t.number
                )}
              </li>
            ))}
          </ul>
        )}
        <a href={order.statusPageUrl} className="inline-block text-sm font-medium underline underline-offset-4">
          View Shopify order status page
        </a>
      </section>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "border-t border-foreground/15 pt-2 text-base font-semibold" : ""}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
