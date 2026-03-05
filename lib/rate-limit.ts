/**
 * In-memory rate limiter for API routes.
 * Uses a Map with TTL-based cleanup.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 60 seconds
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 60000);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, 60000);
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfter?: number } {
  ensureCleanup();

  const now = Date.now();
  const entry = store.get(key) || { timestamps: [] };

  // Filter to only timestamps within the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    store.set(key, entry);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return { allowed: true, remaining: limit - entry.timestamps.length };
}
