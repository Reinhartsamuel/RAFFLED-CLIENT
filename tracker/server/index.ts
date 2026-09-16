/**
 * Tracker service entrypoint. Loads configuration from the environment (see
 * .env.example), connects to Postgres, and serves the ingestion API.
 */

import pg from 'pg';
import {
  APP_VERSION,
  DEFAULT_CORS_ORIGINS,
  buildApp,
  type TrackerConfig,
} from './app.ts';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`missing required environment variable ${name}`);
  return value;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function listEnv(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (!raw) return fallback;
  const values = raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value !== '');
  return values.length > 0 ? values : fallback;
}

const databaseUrl = requiredEnv('DATABASE_URL');
const port = intEnv('PORT', 8787);
const isProduction = process.env.NODE_ENV === 'production';

const config: TrackerConfig = {
  corsOrigins: listEnv('CORS_ORIGINS', DEFAULT_CORS_ORIGINS),
  rateLimitPerIp: intEnv('RATE_LIMIT_PER_IP', 120),
  rateLimitPerAnon: intEnv('RATE_LIMIT_PER_ANON_PER_MIN', 300),
  rateLimitGlobal: intEnv('RATE_LIMIT_GLOBAL_PER_MIN', 6000),
  release: process.env.TRACKER_RELEASE ?? null,
  version: APP_VERSION,
  trustProxy: process.env.TRUST_PROXY === 'true',
};

const pool = new pg.Pool({ connectionString: databaseUrl, max: 10 });
const app = buildApp({ db: pool, config, logger: isProduction });

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, 'shutting_down');
  try {
    await app.close();
  } finally {
    await pool.end();
  }
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown(signal).then(
      () => process.exit(0),
      () => process.exit(1),
    );
  });
}

await app.listen({ port, host: '0.0.0.0' });
