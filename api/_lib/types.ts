import type { ZodType } from 'zod';
import type { AiStreamEvent } from '../../src/schemas/index.js';

/** Structural subsets of the Vercel request/response so handlers are trivial to unit test. */
export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string };
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
  /** Present on real (Node) responses; used to stream thought summaries as NDJSON. */
  write?(chunk: string): unknown;
  end?(): unknown;
}

export type ErrorCode =
  | 'METHOD_NOT_ALLOWED'
  | 'FORBIDDEN_ORIGIN'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'PAYLOAD_TOO_LARGE'
  | 'INVALID_INPUT'
  | 'RATE_LIMITED'
  | 'AI_RESPONSE_INVALID'
  | 'AI_TIMEOUT'
  | 'AI_UNAVAILABLE'
  | 'INTERNAL';

export interface HandlerConfig<I> {
  /** Route name, used as the cache namespace. */
  name: string;
  input: ZodType<I>;
  /** Returns data that has already been validated against the endpoint's output schema. */
  run: (input: I, onEvent?: (event: AiStreamEvent) => void) => Promise<unknown>;
}

