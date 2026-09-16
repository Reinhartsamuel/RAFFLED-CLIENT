/**
 * Fastify app: hardened ingestion endpoints + healthz.
 *
 * Request logs never contain bodies - tracked payloads can contain URLs with
 * query params. Only method/path/status/duration and acceptance counts are logged.
 */

import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyReply,
  type FastifyServerOptions,
} from 'fastify';
import type {
  AcceptedRejected,
  ClientErrorRow,
  EventRow,
  PerfRow,
} from '../shared/types.ts';
import { Ingest, type Queryable } from './ingest.ts';
import { createWindowLimiter } from './rate-limit.ts';
import {
  BatchTooLargeError,
  EnvelopeError,
  LIMITS,
  extractAnonymousId,
  readEnvelope,
  sanitizeUserAgent,
  validateError,
  validateEvent,
  validatePerf,
} from './validation.ts';

export const APP_VERSION = '0.1.0';

export const DEFAULT_CORS_ORIGINS = [
  'https://winr.fun',
  'https://raffled.tuttilabs.xyz',
  'http://localhost:5173',
];

export interface TrackerConfig {
  corsOrigins: string[];
  rateLimitPerIp: number;
  rateLimitPerAnon: number;
  rateLimitGlobal: number;
  release: string | null;
  version: string;
  trustProxy: boolean;
}

export interface BuildAppOptions {
  db: Queryable;
  config: TrackerConfig;
  logger?: FastifyServerOptions['logger'];
}

const WINDOW_MS = 60_000;

function handleEnvelopeError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof EnvelopeError) {
    return reply.code(error.statusCode).send({ error: 'bad_request' });
  }
  if (error instanceof BatchTooLargeError) {
    return reply.code(error.statusCode).send({ error: 'batch_too_large' });
  }
  throw error;
}

export function buildApp(options: BuildAppOptions): FastifyInstance {
  const { db, config } = options;

  const app = Fastify({
    bodyLimit: LIMITS.bodyBytes,
    logger: options.logger ?? false,
    trustProxy: config.trustProxy,
  });

  const ingest = new Ingest(db);
  const globalLimiter = createWindowLimiter({ windowMs: WINDOW_MS, max: config.rateLimitGlobal });
  const anonLimiter = createWindowLimiter({ windowMs: WINDOW_MS, max: config.rateLimitPerAnon });

  // Primary content type is text/plain so unload-time sends (keepalive/sendBeacon)
  // do not need a CORS preflight. JSON is parsed manually after the size check.
  app.addContentTypeParser(
    'text/plain',
    { parseAs: 'string', bodyLimit: LIMITS.bodyBytes },
    (_request, body, done) => {
      const raw = typeof body === 'string' ? body : '';
      if (raw.trim() === '') {
        done(Object.assign(new Error('empty_body'), { statusCode: 400 }));
        return;
      }
      try {
        done(null, JSON.parse(raw));
      } catch {
        done(Object.assign(new Error('invalid_json'), { statusCode: 400 }));
      }
    },
  );

  void app.register(cors, {
    origin: config.corsOrigins,
    methods: ['POST', 'OPTIONS'],
    credentials: false,
    maxAge: 600,
  });

  void app.register(rateLimit, {
    global: true,
    max: config.rateLimitPerIp,
    timeWindow: '1 minute',
    allowList: (request) => request.url.split('?')[0] === '/healthz',
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const status = typeof error.statusCode === 'number' && error.statusCode >= 400 ? error.statusCode : 500;
    if (status === 413) return reply.code(413).send({ error: 'payload_too_large' });
    if (status === 400) return reply.code(400).send({ error: 'bad_request' });
    if (status === 429) return reply.code(429).send({ error: 'rate_limited' });
    request.log.error({ err: error }, 'request_failed');
    return reply.code(500).send({ error: 'internal_error' });
  });

  app.get('/healthz', async (_request, reply) => {
    let ok = true;
    let database = 'up';
    try {
      await db.query('SELECT 1');
    } catch {
      ok = false;
      database = 'down';
    }
    return reply.code(ok ? 200 : 503).send({
      ok,
      db: database,
      version: config.version,
      release: config.release,
    });
  });

  app.post('/v1/events', async (request, reply) => {
    if (!globalLimiter.check('global')) return reply.code(429).send({ error: 'rate_limited' });

    let items: unknown[];
    try {
      items = readEnvelope(request.body, 'events', LIMITS.batch.events);
    } catch (error) {
      return handleEnvelopeError(reply, error);
    }

    if (!anonLimiter.check(extractAnonymousId(request.body, 'events') ?? `ip:${request.ip}`)) {
      return reply.code(429).send({ error: 'rate_limited' });
    }

    const userAgent = sanitizeUserAgent(request.headers['user-agent']);
    const rows: EventRow[] = [];
    for (const item of items) {
      const row = validateEvent(item, userAgent);
      if (row) rows.push(row);
    }

    const accepted = await ingest.insertEvents(rows);
    const rejected = items.length - accepted;
    request.log.info({ endpoint: 'events', accepted, rejected }, 'ingest_batch');
    return reply.code(202).send({ accepted, rejected } satisfies AcceptedRejected);
  });

  app.post('/v1/errors', async (request, reply) => {
    if (!globalLimiter.check('global')) return reply.code(429).send({ error: 'rate_limited' });

    let items: unknown[];
    try {
      items = readEnvelope(request.body, 'errors', LIMITS.batch.errors);
    } catch (error) {
      return handleEnvelopeError(reply, error);
    }

    if (!anonLimiter.check(extractAnonymousId(request.body, 'errors') ?? `ip:${request.ip}`)) {
      return reply.code(429).send({ error: 'rate_limited' });
    }

    const userAgent = sanitizeUserAgent(request.headers['user-agent']);
    const rows: ClientErrorRow[] = [];
    for (const item of items) {
      const row = validateError(item, userAgent);
      if (row) rows.push(row);
    }

    const accepted = await ingest.insertErrors(rows);
    const rejected = items.length - accepted;
    request.log.info({ endpoint: 'errors', accepted, rejected }, 'ingest_batch');
    return reply.code(202).send({ accepted, rejected } satisfies AcceptedRejected);
  });

  app.post('/v1/perf', async (request, reply) => {
    if (!globalLimiter.check('global')) return reply.code(429).send({ error: 'rate_limited' });

    let items: unknown[];
    try {
      items = readEnvelope(request.body, 'measurements', LIMITS.batch.perf);
    } catch (error) {
      return handleEnvelopeError(reply, error);
    }

    if (!anonLimiter.check(extractAnonymousId(request.body, 'measurements') ?? `ip:${request.ip}`)) {
      return reply.code(429).send({ error: 'rate_limited' });
    }

    const userAgent = sanitizeUserAgent(request.headers['user-agent']);
    const rows: PerfRow[] = [];
    for (const item of items) {
      const row = validatePerf(item, userAgent);
      if (row) rows.push(row);
    }

    const accepted = await ingest.insertPerf(rows);
    const rejected = items.length - accepted;
    request.log.info({ endpoint: 'perf', accepted, rejected }, 'ingest_batch');
    return reply.code(202).send({ accepted, rejected } satisfies AcceptedRejected);
  });

  return app;
}
