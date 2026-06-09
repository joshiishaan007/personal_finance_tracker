import { HttpError } from './errors';

// In-process fixed-window rate limiter. Keyed by `${bucket}:${userId}`.
//
// NOTE: serverless instances don't share memory, so this bounds usage PER
// instance, not globally. On a Hobby/single-instance deploy that is the common
// case and is enough to stop one user pinning the shared Gemini free-tier quota
// or opening many simultaneous long upstream calls. For strict global limits a
// shared store (Redis/Upstash) would be needed.
const hits = new Map<string, { count: number; resetAt: number }>();

// Opportunistic cleanup so the map can't grow unbounded across many users.
function sweep(now: number) {
  if (hits.size < 5000) return;
  for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
}

/**
 * Throws HttpError(429) when `key` exceeds `limit` requests within `windowMs`.
 * Map HttpError(429) → the standard envelope via catchRoute.
 */
export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  sweep(now);
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (entry.count >= limit) {
    throw new HttpError(429, 'Too many requests — please slow down');
  }
  entry.count++;
}
