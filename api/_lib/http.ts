import type { ApiRequest, ApiResponse, ErrorCode, HandlerConfig } from './types.js';
import { CACHE_TTL_MS, cacheGet, cacheKey, cacheSet } from './cache.js';
import { isRateLimited, clientIp } from './rate-limit.js';
import { storeGet, storeKey, storeSet } from './store.js';

export * from './types.js';
export * from './rate-limit.js';

export const NDJSON = 'application/x-ndjson';
export const MAX_BODY_BYTES = 8 * 1024;

export class ApiFailure extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  constructor(status: number, code: ErrorCode) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

/**
 * Safe reviver for JSON.parse that prevents prototype pollution by rejecting
 * __proto__, constructor, and prototype property keys.
 */
export function safeJsonReviver(key: string, value: unknown): unknown {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    throw new Error(`Prototype pollution attempt detected: ${key}`);
  }
  return value;
}

function header(req: ApiRequest, name: string): string {
  const value = req.headers[name];
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

/** Validated AI results: shared store first (if configured), then this instance's memory. */
async function readCache(key: string): Promise<unknown> {
  const local = cacheGet(key);
  if (local !== undefined) return local;
  const shared = await storeGet(storeKey('cache', key));
  if (shared !== undefined) cacheSet(key, shared);
  return shared;
}

async function writeCache(key: string, value: unknown): Promise<void> {
  cacheSet(key, value);
  await storeSet(storeKey('cache', key), value, CACHE_TTL_MS / 1000);
}

function bodyBytes(body: unknown): number {
  if (typeof body === 'string') return Buffer.byteLength(body);
  try {
    const stringify: (value: unknown) => string | undefined = JSON.stringify;
    return Buffer.byteLength(stringify(body) ?? '');
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

/**
 * Only our own pages may spend the AI quota. Browsers always send Origin on a POST; it must match
 * the host serving the API. Cross-site requests and clients that hide where they come from are
 * refused.
 */
export function sameOrigin(req: ApiRequest): boolean {
  const origin = header(req, 'origin');
  const host = header(req, 'x-forwarded-host') || header(req, 'host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host.split(',')[0]?.trim();
  } catch {
    return false;
  }
}

function fail(res: ApiResponse, status: number, code: ErrorCode): void {
  res.status(status).json({ error: code });
}

function failureCode(error: unknown): ErrorCode {
  if (error instanceof ApiFailure) return error.code;
  console.error('api: unexpected failure');
  return 'INTERNAL';
}

/**
 * Streams one AI call as NDJSON: thought summaries and model switches as they happen, then exactly
 * one `result` (already validated) or `error` line.
 */
async function streamRun<I>(
  res: ApiResponse,
  config: HandlerConfig<I>,
  input: I,
  key: string,
): Promise<void> {
  res.setHeader('Content-Type', `${NDJSON}; charset=utf-8`);
  res.setHeader('X-Accel-Buffering', 'no');
  res.status(200);
  const send = (line: unknown) => res.write?.(`${JSON.stringify(line)}\n`);
  try {
    const result = await config.run(input, send);
    await writeCache(key, result);
    send({ type: 'result', data: result });
  } catch (error) {
    send({ type: 'error', error: failureCode(error) });
  }
  res.end?.();
}

/** Shared pipeline: method guard, content type, rate limit, size cap, validate, run, respond. */
export function createHandler<I>(config: HandlerConfig<I>) {
  return async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      fail(res, 405, 'METHOD_NOT_ALLOWED');
      return;
    }
    if (!sameOrigin(req)) {
      fail(res, 403, 'FORBIDDEN_ORIGIN');
      return;
    }
    if (!header(req, 'content-type').toLowerCase().startsWith('application/json')) {
      fail(res, 415, 'UNSUPPORTED_MEDIA_TYPE');
      return;
    }
    if (await isRateLimited(clientIp(req))) {
      res.setHeader('Retry-After', '300');
      fail(res, 429, 'RATE_LIMITED');
      return;
    }
    const declared = Number(header(req, 'content-length'));
    if (
      (Number.isFinite(declared) && declared > MAX_BODY_BYTES) ||
      bodyBytes(req.body) > MAX_BODY_BYTES
    ) {
      fail(res, 413, 'PAYLOAD_TOO_LARGE');
      return;
    }
    let body: unknown = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body, safeJsonReviver);
      } catch {
        fail(res, 400, 'INVALID_INPUT');
        return;
      }
    }
    const parsed = config.input.safeParse(body);
    if (!parsed.success) {
      fail(res, 400, 'INVALID_INPUT');
      return;
    }
    const key = cacheKey(config.name, parsed.data);
    const cached = await readCache(key);
    if (cached !== undefined) {
      res.setHeader('X-Cache', 'HIT');
      res.status(200).json(cached);
      return;
    }
    if (header(req, 'accept').includes(NDJSON) && res.write && res.end) {
      await streamRun(res, config, parsed.data, key);
      return;
    }
    try {
      const result = await config.run(parsed.data);
      await writeCache(key, result);
      res.status(200).json(result);
    } catch (error) {
      const code = failureCode(error);
      fail(res, error instanceof ApiFailure ? error.status : 500, code);
    }
  };
}
