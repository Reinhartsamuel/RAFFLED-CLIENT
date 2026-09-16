import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { APP_VERSION, buildApp, type TrackerConfig } from '../server/app.ts';
import type { Queryable, QueryResultLike } from '../server/ingest.ts';
import { LIMITS } from '../server/validation.ts';

interface RecordedQuery {
  text: string;
  values: unknown[];
}

interface FakeDb extends Queryable {
  queries: RecordedQuery[];
  state: { failHealth: boolean };
}

function makeDb(): FakeDb {
  const queries: RecordedQuery[] = [];
  const state = { failHealth: false };
  return {
    queries,
    state,
    async query(text: string, values?: unknown[]): Promise<QueryResultLike> {
      queries.push({ text, values: values ?? [] });
      if (/^select 1$/i.test(text.trim()) && state.failHealth) throw new Error('db down');
      return { rowCount: 0, rows: [] };
    },
  };
}

function testConfig(overrides: Partial<TrackerConfig> = {}): TrackerConfig {
  return {
    corsOrigins: ['http://localhost:5173'],
    rateLimitPerIp: 100_000,
    rateLimitPerAnon: 100_000,
    rateLimitGlobal: 100_000,
    release: 'test-release',
    version: APP_VERSION,
    trustProxy: false,
    ...overrides,
  };
}

const apps: FastifyInstance[] = [];

function createApp(db: Queryable, config: TrackerConfig = testConfig()): FastifyInstance {
  const app = buildApp({ db, config, logger: false });
  apps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

const validEvent = {
  event_name: 'raffle_viewed',
  environment: 'production',
  network: 'base_mainnet',
  anonymous_id: 'anon-1',
  session_id: 'sess-1',
  properties: { raffle_id: '7' },
};

const postOptions = {
  method: 'POST' as const,
  headers: { 'content-type': 'text/plain;charset=UTF-8' },
};

describe('GET /healthz', () => {
  it('reports a truthful, secret-free shape', async () => {
    const db = makeDb();
    const app = createApp(db);
    const response = await app.inject({ method: 'GET', url: '/healthz' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(Object.keys(body).sort()).toEqual(['db', 'ok', 'release', 'version']);
    expect(body).toEqual({ ok: true, db: 'up', version: APP_VERSION, release: 'test-release' });
    expect(response.body).not.toContain('postgres');
    expect(response.body).not.toContain('DATABASE_URL');
  });

  it('fails loudly when the database is unavailable', async () => {
    const db = makeDb();
    db.state.failHealth = true;
    const app = createApp(db);
    const response = await app.inject({ method: 'GET', url: '/healthz' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ ok: false, db: 'down' });
  });
});

describe('POST /v1/events', () => {
  it('accepts a text/plain JSON batch and persists one multi-row insert', async () => {
    const db = makeDb();
    const app = createApp(db);
    const response = await app.inject({
      ...postOptions,
      url: '/v1/events',
      payload: JSON.stringify({ events: [validEvent, { ...validEvent, anonymous_id: 'anon-2' }] }),
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ accepted: 2, rejected: 0 });

    const inserts = db.queries.filter((query) => query.text.startsWith('INSERT INTO events'));
    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.values).toHaveLength(2 * 14);
    expect(inserts[0]?.values).toContain('production');
    expect(inserts[0]?.values).toContain('base_mainnet');
  });

  it('partially accepts a batch and never 500s on one bad row', async () => {
    const db = makeDb();
    const app = createApp(db);
    const response = await app.inject({
      ...postOptions,
      url: '/v1/events',
      payload: JSON.stringify({
        events: [
          validEvent,
          { ...validEvent, event_name: 'not_a_real_event' },
          { ...validEvent, environment: 'staging' },
        ],
      }),
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ accepted: 1, rejected: 2 });
    const inserts = db.queries.filter((query) => query.text.startsWith('INSERT INTO events'));
    expect(inserts[0]?.values).toHaveLength(14);
  });

  it('rejects a malformed envelope with 400', async () => {
    const app = createApp(makeDb());
    const missingKey = await app.inject({
      ...postOptions,
      url: '/v1/events',
      payload: JSON.stringify({ nope: [] }),
    });
    expect(missingKey.statusCode).toBe(400);

    const notAnObject = await app.inject({
      ...postOptions,
      url: '/v1/events',
      payload: JSON.stringify([validEvent]),
    });
    expect(notAnObject.statusCode).toBe(400);

    const invalidJson = await app.inject({
      ...postOptions,
      url: '/v1/events',
      payload: '{ not json',
    });
    expect(invalidJson.statusCode).toBe(400);
  });

  it('rejects a batch over the per-endpoint cap with 413', async () => {
    const app = createApp(makeDb());
    const events = Array.from({ length: LIMITS.batch.events + 1 }, () => validEvent);
    const response = await app.inject({
      ...postOptions,
      url: '/v1/events',
      payload: JSON.stringify({ events }),
    });
    expect(response.statusCode).toBe(413);
  });

  it('rejects an oversized body with 413', async () => {
    const app = createApp(makeDb());
    const response = await app.inject({
      ...postOptions,
      url: '/v1/events',
      payload: 'x'.repeat(LIMITS.bodyBytes + 1),
    });
    expect(response.statusCode).toBe(413);
    expect(response.json()).toEqual({ error: 'payload_too_large' });
  });

  it('enforces the per-anonymous rate limit with 429', async () => {
    const app = createApp(makeDb(), testConfig({ rateLimitPerAnon: 2 }));
    const url = '/v1/events';
    const payload = JSON.stringify({ events: [validEvent] });

    const first = await app.inject({ ...postOptions, url, payload });
    const second = await app.inject({ ...postOptions, url, payload });
    const third = await app.inject({ ...postOptions, url, payload });

    expect([first.statusCode, second.statusCode, third.statusCode]).toEqual([202, 202, 429]);
  });

  it('accepts application/json too', async () => {
    const app = createApp(makeDb());
    const response = await app.inject({
      method: 'POST',
      url: '/v1/events',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ events: [validEvent] }),
    });
    expect(response.statusCode).toBe(202);
  });
});

describe('POST /v1/errors', () => {
  it('stores a fingerprint and redacts secrets end to end', async () => {
    const db = makeDb();
    const app = createApp(db);
    const response = await app.inject({
      ...postOptions,
      url: '/v1/errors',
      payload: JSON.stringify({
        errors: [
          {
            error_type: 'RafflePurchaseError',
            message: 'reverted for 0x1234567890 with amount 5',
            stack: 'Error: x\n  at buy (/app/dist/index-abc.js:1:100)',
            environment: 'production',
            network: 'robinhood_mainnet',
            release: 'rel-9',
            anonymous_id: 'anon-9',
            metadata: { mnemonic: 'do not store', raffle_id: '7' },
          },
        ],
      }),
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ accepted: 1, rejected: 0 });

    const insert = db.queries.find((query) => query.text.startsWith('INSERT INTO client_errors'));
    expect(insert).toBeDefined();
    const metadata = insert?.values.find(
      (value) => typeof value === 'string' && value.startsWith('{'),
    );
    expect(metadata).toBe(JSON.stringify({ raffle_id: '7' }));
    const fingerprint = insert?.values.find(
      (value) => typeof value === 'string' && /^[0-9a-f]{32}$/.test(value),
    );
    expect(fingerprint).toBeDefined();
    expect(insert?.values.join('|')).not.toContain('do not store');
  });
});

describe('POST /v1/perf', () => {
  it('accepts measurements and rejects invalid values per row', async () => {
    const db = makeDb();
    const app = createApp(db);
    const response = await app.inject({
      ...postOptions,
      url: '/v1/perf',
      payload: JSON.stringify({
        measurements: [
          {
            metric_name: 'LCP',
            value: 2100,
            unit: 'ms',
            environment: 'production',
            network: 'base_mainnet',
            anonymous_id: 'anon-1',
          },
          {
            metric_name: 'INP',
            value: 'fast',
            unit: 'ms',
            environment: 'production',
            network: 'base_mainnet',
          },
        ],
      }),
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ accepted: 1, rejected: 1 });
  });
});

describe('CORS', () => {
  it('allows a configured origin and omits unlisted ones', async () => {
    const app = createApp(makeDb());

    const allowed = await app.inject({
      method: 'OPTIONS',
      url: '/v1/events',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'POST',
      },
    });
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const denied = await app.inject({
      method: 'OPTIONS',
      url: '/v1/events',
      headers: {
        origin: 'https://evil.example',
        'access-control-request-method': 'POST',
      },
    });
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});
