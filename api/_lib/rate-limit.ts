import type { ApiRequest } from './types.js';
import { incrementWindow, storeKey } from './store.js';

export const RATE_LIMIT_MAX = 20;
export const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function header(req: ApiRequest, name: string): string {
  const value = req.headers[name];
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

/**
 * Extracts a best-effort client IP address from standard and platform headers,
 * used purely as a sliding-window rate limit key.
 *
 * @param req - Incoming API request.
 * @returns Detected IP address string or 'unknown'.
 */
export function clientIp(req: ApiRequest): string {
  const platform = header(req, 'x-vercel-forwarded-for') || header(req, 'x-real-ip');
  const forwarded = header(req, 'x-forwarded-for').split(',')[0]?.trim();
  if (platform) return platform;
  if (forwarded) return forwarded;
  return req.socket?.remoteAddress ?? 'unknown';
}

const hits = new Map<string, number[]>();

/**
 * Per-instance sliding-window limiter, used when no shared store is configured.
 *
 * @param ip - Client IP identifier.
 * @param now - Current epoch timestamp in ms.
 * @returns True if rate limit is exceeded.
 */
export function rateLimited(ip: string, now: number = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

/** Clears all in-memory rate-limiting windows (used between tests). */
export function resetRateLimit(): void {
  hits.clear();
}

/**
 * Checks rate limits using a shared distributed store when configured, falling back to memory.
 *
 * @param ip - Client IP identifier.
 * @param now - Current epoch timestamp in ms.
 * @returns Promise resolving to true if rate limited.
 */
export async function isRateLimited(ip: string, now: number = Date.now()): Promise<boolean> {
  const window = Math.floor(now / RATE_LIMIT_WINDOW_MS);
  const count = await incrementWindow(
    storeKey('rl', `${ip}:${window}`),
    RATE_LIMIT_WINDOW_MS / 1000,
  );
  return count === null ? rateLimited(ip, now) : count > RATE_LIMIT_MAX;
}

