/**
 * Ingestion validation and sanitization.
 *
 * Everything here treats the payload as hostile: field limits, enum enforcement,
 * an `event_name` allowlist, per-event property allowlists, a recursive redaction
 * denylist, and JSON shape/size bounds. One bad row rejects that row only; the
 * rest of the batch still lands (`{accepted, rejected}`).
 */

import {
  EVENT_REGISTRY_LOOKUP,
  isEventName,
  isTransactionFailureCategory,
} from '../shared/events.ts';
import {
  isAppEnvironment,
  isAppNetwork,
  networkFromChainId,
  type AppEnvironment,
  type AppNetwork,
  type ClientErrorRow,
  type EventRow,
  type PerfRow,
} from '../shared/types.ts';
import { fingerprintError } from './fingerprint.ts';

export const LIMITS = {
  /** Hard body cap, also enforced by Fastify. */
  bodyBytes: 64 * 1024,
  batch: { events: 50, errors: 20, perf: 50 },
  event_name: 64,
  error_type: 128,
  metric_name: 64,
  unit: 32,
  message: 2000,
  stack: 8192,
  url: 2048,
  route: 256,
  user_agent: 512,
  id: 128,
  release: 128,
  commit_sha: 64,
  request_id: 128,
  json: {
    keys: 30,
    depth: 3,
    string: 512,
    bytes: 4096,
  },
} as const;

/**
 * Case- and separator-insensitive denylist. Matching keys are dropped, never
 * masked. Applied recursively to `properties` and `metadata`.
 */
const REDACT_KEYS = new Set(
  [
    'password',
    'passwd',
    'secret',
    'privatekey',
    'private_key',
    'mnemonic',
    'seed',
    'seedphrase',
    'token',
    'access_token',
    'refresh_token',
    'authorization',
    'cookie',
    'apikey',
    'api_key',
    'signature',
    'signedmessage',
    'email',
    'phone',
    'ip',
  ].map(normalizeKey),
);

export function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export class EnvelopeError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'EnvelopeError';
  }
}

export class BatchTooLargeError extends Error {
  readonly statusCode = 413;
  constructor(message: string) {
    super(message);
    this.name = 'BatchTooLargeError';
  }
}

/** Thrown internally per row; never escapes a `validate*` function. */
class RowRejected extends Error {}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function requiredString(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.trim() === '') throw new RowRejected('missing_string');
  return truncate(value.trim(), max);
}

function optionalString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : truncate(trimmed, max);
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function walkValue(value: unknown, level: number): unknown {
  if (typeof value === 'string') {
    if (value.length > LIMITS.json.string) throw new RowRejected('json_string_too_long');
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return value;
  }
  if (typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) {
    if (level > LIMITS.json.depth) throw new RowRejected('json_depth');
    if (value.length > LIMITS.json.keys) throw new RowRejected('json_array_too_long');
    return value.map((item) => walkValue(item, level));
  }
  if (isPlainObject(value)) return walkObject(value, level);
  return undefined;
}

function walkObject(input: Record<string, unknown>, level: number): Record<string, unknown> {
  if (level > LIMITS.json.depth) throw new RowRejected('json_depth');

  const keys = Object.keys(input).filter((key) => !REDACT_KEYS.has(normalizeKey(key)));
  if (keys.length > LIMITS.json.keys) throw new RowRejected('json_too_many_keys');

  const output: Record<string, unknown> = {};
  for (const key of keys) {
    const value = walkValue(input[key], level + 1);
    if (value !== undefined) output[key] = value;
  }
  return output;
}

/**
 * Redact denied keys, drop non-JSON values, enforce depth/key/string bounds,
 * then enforce the serialized byte cap.
 */
export function sanitizeJson(input: unknown): Record<string, unknown> {
  if (input === undefined || input === null) return {};
  if (!isPlainObject(input)) throw new RowRejected('json_not_object');

  const output = walkObject(input, 1);
  if (Buffer.byteLength(JSON.stringify(output), 'utf8') > LIMITS.json.bytes) {
    throw new RowRejected('json_too_large');
  }
  return output;
}

interface Context {
  client_ts: Date | null;
  anonymous_id: string | null;
  session_id: string | null;
  user_ref: string | null;
  environment: AppEnvironment;
  network: AppNetwork;
  release: string | null;
  commit_sha: string | null;
  url: string | null;
  route: string | null;
  request_id: string | null;
  user_agent: string | null;
}

function validateContext(
  input: Record<string, unknown>,
  userAgent: string | null,
  chainIdHint: unknown,
): Context {
  if (!isAppEnvironment(input.environment)) throw new RowRejected('invalid_environment');

  let network: AppNetwork | null = null;
  if (isAppNetwork(input.network) && input.network !== 'unknown') {
    network = input.network;
  } else {
    network = networkFromChainId(chainIdHint);
    if (!network && isAppNetwork(input.network)) network = input.network;
  }
  if (!network) throw new RowRejected('invalid_network');

  return {
    client_ts: parseDate(input.client_ts),
    anonymous_id: optionalString(input.anonymous_id, LIMITS.id),
    session_id: optionalString(input.session_id, LIMITS.id),
    user_ref: optionalString(input.user_ref, LIMITS.id),
    environment: input.environment,
    network,
    release: optionalString(input.release, LIMITS.release),
    commit_sha: optionalString(input.commit_sha, LIMITS.commit_sha),
    url: optionalString(input.url, LIMITS.url),
    route: optionalString(input.route, LIMITS.route),
    request_id: optionalString(input.request_id, LIMITS.request_id),
    user_agent: userAgent,
  };
}

export function validateEvent(input: unknown, userAgent: string | null = null): EventRow | null {
  try {
    if (!isPlainObject(input)) throw new RowRejected('not_object');

    const eventName = requiredString(input.event_name, LIMITS.event_name);
    if (!isEventName(eventName)) throw new RowRejected('unknown_event_name');
    const spec = EVENT_REGISTRY_LOOKUP[eventName];
    if (!spec) throw new RowRejected('unknown_event_name');

    const properties = sanitizeJson(input.properties);
    for (const key of spec.required) {
      if (!(key in properties)) throw new RowRejected(`missing_property:${key}`);
    }
    if (eventName === 'transaction_failed' && !isTransactionFailureCategory(properties.category)) {
      throw new RowRejected('invalid_transaction_failure_category');
    }

    const context = validateContext(input, userAgent, properties.chain_id);

    const allowed = new Set<string>([...spec.required, ...spec.optional]);
    const cleaned: Record<string, unknown> = {};
    for (const key of Object.keys(properties)) {
      if (allowed.has(key)) cleaned[key] = properties[key];
    }

    return { ...context, event_name: eventName, properties: cleaned };
  } catch (error) {
    if (error instanceof RowRejected) return null;
    throw error;
  }
}

export function validateError(input: unknown, userAgent: string | null = null): ClientErrorRow | null {
  try {
    if (!isPlainObject(input)) throw new RowRejected('not_object');

    const errorType = requiredString(input.error_type, LIMITS.error_type);
    const message = requiredString(input.message, LIMITS.message);
    const stack = optionalString(input.stack, LIMITS.stack);
    const metadata = sanitizeJson(input.metadata);
    const context = validateContext(input, userAgent, metadata.chain_id);

    return {
      ...context,
      error_type: errorType,
      message,
      stack,
      metadata,
      fingerprint: fingerprintError({
        error_type: errorType,
        message,
        stack,
        release: context.release,
      }),
    };
  } catch (error) {
    if (error instanceof RowRejected) return null;
    throw error;
  }
}

export function validatePerf(input: unknown, userAgent: string | null = null): PerfRow | null {
  try {
    if (!isPlainObject(input)) throw new RowRejected('not_object');

    const metricName = requiredString(input.metric_name, LIMITS.metric_name);
    const unit = requiredString(input.unit, LIMITS.unit);
    if (typeof input.value !== 'number' || !Number.isFinite(input.value)) {
      throw new RowRejected('invalid_value');
    }

    const metadata = sanitizeJson(input.metadata);
    const context = validateContext(input, userAgent, metadata.chain_id);

    return { ...context, metric_name: metricName, value: input.value, unit, metadata };
  } catch (error) {
    if (error instanceof RowRejected) return null;
    throw error;
  }
}

/** Validate the batch envelope. Malformed envelope / oversized batch throws. */
export function readEnvelope(body: unknown, key: string, max: number): unknown[] {
  if (!isPlainObject(body)) throw new EnvelopeError('body_must_be_object');
  const items = body[key];
  if (!Array.isArray(items)) throw new EnvelopeError(`missing_${key}`);
  if (items.length > max) throw new BatchTooLargeError(`batch_too_large:${key}:max_${max}`);
  return items;
}

/** First anonymous id in a batch, used for the per-anonymous rate limit. */
export function extractAnonymousId(body: unknown, key: string): string | null {
  if (!isPlainObject(body)) return null;
  const items = body[key];
  if (!Array.isArray(items)) return null;
  for (const item of items) {
    if (isPlainObject(item) && typeof item.anonymous_id === 'string' && item.anonymous_id !== '') {
      return item.anonymous_id;
    }
  }
  return null;
}

export function sanitizeUserAgent(header: string | string[] | undefined): string | null {
  const raw = Array.isArray(header) ? header[0] : header;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed === '' ? null : truncate(trimmed, LIMITS.user_agent);
}
