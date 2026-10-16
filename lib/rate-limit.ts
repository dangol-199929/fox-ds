/**
 * Small in-memory sliding-window rate limiter.
 *
 * Limitation: on serverless hosting each instance has its own memory, so this
 * slows down abuse from one client rather than enforcing a hard global limit.
 * For stronger protection use a shared store (e.g. Upstash Redis) or the
 * host's firewall rules. Keys are kept only in memory and never logged.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return function check(key: string, now = Date.now()): { allowed: boolean; retryAfterMs: number } {
    const windowStart = now - windowMs;
    const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

    if (recent.length >= limit) {
      hits.set(key, recent);
      return { allowed: false, retryAfterMs: recent[0]! + windowMs - now };
    }

    recent.push(now);
    hits.set(key, recent);

    // Keep memory bounded.
    if (hits.size > 10_000) {
      for (const [k, times] of hits) {
        if (times.every((t) => t <= windowStart)) hits.delete(k);
      }
    }
    return { allowed: true, retryAfterMs: 0 };
  };
}
