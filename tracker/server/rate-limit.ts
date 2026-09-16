/**
 * In-memory fixed-window rate limiting.
 *
 * Per-IP limiting is handled by @fastify/rate-limit; these limiters cover the
 * two layers it cannot express (per-anonymous-id and a global cap). Layering
 * matters because per-IP alone is trivially defeated.
 */

export interface WindowLimiter {
  check(key: string): boolean;
  reset(): void;
  size(): number;
}

export interface WindowLimiterOptions {
  windowMs: number;
  /** Requests allowed per key per window. Values <= 0 disable limiting. */
  max: number;
  now?: () => number;
  /** Soft cap on tracked keys; expired entries are pruned past this. */
  maxKeys?: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export function createWindowLimiter(options: WindowLimiterOptions): WindowLimiter {
  const { windowMs, max, now = Date.now, maxKeys = 10_000 } = options;
  const buckets = new Map<string, Bucket>();

  function prune(current: number): void {
    for (const [key, bucket] of buckets) {
      if (current >= bucket.resetAt) buckets.delete(key);
    }
  }

  return {
    check(key: string): boolean {
      if (max <= 0) return true;

      const current = now();
      const bucket = buckets.get(key);

      if (!bucket || current >= bucket.resetAt) {
        if (buckets.size >= maxKeys) prune(current);
        buckets.set(key, { count: 1, resetAt: current + windowMs });
        return true;
      }

      bucket.count += 1;
      return bucket.count <= max;
    },
    reset(): void {
      buckets.clear();
    },
    size(): number {
      return buckets.size;
    },
  };
}
