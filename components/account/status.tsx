// Plain-English labels for Shopify order statuses, with text not just colour.
const FINANCIAL: Record<string, string> = {
  PAID: "Paid",
  PENDING: "Payment pending",
  AUTHORIZED: "Payment authorised",
  PARTIALLY_PAID: "Partly paid",
  PARTIALLY_REFUNDED: "Partly refunded",
  REFUNDED: "Refunded",
  VOIDED: "Cancelled",
  EXPIRED: "Payment expired",
};

const FULFILMENT: Record<string, string> = {
  UNFULFILLED: "Not shipped yet",
  PARTIALLY_FULFILLED: "Partly shipped",
  FULFILLED: "Shipped",
  IN_PROGRESS: "Being prepared",
  ON_HOLD: "On hold",
  OPEN: "Not shipped yet",
  PENDING_FULFILLMENT: "Being prepared",
  RESTOCKED: "Returned",
  SCHEDULED: "Scheduled",
};

export function orderStatus(order: {
  cancelledAt: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string;
}): string {
  if (order.cancelledAt) return "Cancelled";
  const parts = [
    order.financialStatus ? (FINANCIAL[order.financialStatus] ?? order.financialStatus) : null,
    FULFILMENT[order.fulfillmentStatus] ?? order.fulfillmentStatus,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}
