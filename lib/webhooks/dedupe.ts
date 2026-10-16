/**
 * Remembers recently processed webhook deliveries so Shopify retries and
 * duplicate deliveries are acknowledged without being processed twice.
 *
 * Limitation: in-memory, so each server instance has its own memory. That's
 * acceptable here because the only handler (cache revalidation) is
 * idempotent: processing a duplicate is harmless, just wasted work.
 */
export function createDeliveryLog(maxEntries = 1000) {
  const seen = new Map<string, number>();

  return {
    /** Returns true the first time an id is seen, false for repeats. */
    firstDelivery(id: string): boolean {
      if (seen.has(id)) return false;
      seen.set(id, Date.now());
      if (seen.size > maxEntries) {
        const oldest = seen.keys().next().value;
        if (oldest !== undefined) seen.delete(oldest);
      }
      return true;
    },
  };
}
