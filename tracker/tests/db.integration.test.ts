/**
 * DB-backed tests. Only run when TRACKER_TEST_DATABASE_URL points at a
 * throwaway Postgres database:
 *
 *   TRACKER_TEST_DATABASE_URL=postgres://... bun run test
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { runMigrations } from '../db/migrate.js';
import { Ingest } from '../server/ingest.ts';
import { validateError, validateEvent } from '../server/validation.ts';

const databaseUrl = process.env.TRACKER_TEST_DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describeDb('tracker database', () => {
  const anonymousId = `it-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let pool: pg.Pool;
  let ingest: Ingest;

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: databaseUrl });
    ingest = new Ingest(pool);
  });

  afterAll(async () => {
    if (!pool) return;
    await pool.query('DELETE FROM events WHERE anonymous_id = $1', [anonymousId]);
    await pool.query('DELETE FROM client_errors WHERE anonymous_id = $1', [anonymousId]);
    await pool.query('DELETE FROM performance_measurements WHERE anonymous_id = $1', [anonymousId]);
    await pool.end();
  });

  it('applies migrations idempotently', async () => {
    const first = await runMigrations(pool);
    const second = await runMigrations(pool);
    expect(second).toBe(0);
    expect(first).toBeGreaterThanOrEqual(0);

    const { rows } = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('events', 'client_errors', 'performance_measurements', 'schema_migrations')`,
    );
    expect(rows).toHaveLength(4);
  });

  it('round-trips an event with environment and network intact', async () => {
    const row = validateEvent({
      event_name: 'raffle_viewed',
      environment: 'production',
      network: 'robinhood_testnet',
      anonymous_id: anonymousId,
      session_id: 'sess-db',
      url: 'https://winr.fun/raffle/1',
      properties: { raffle_id: '1' },
    });
    expect(row).not.toBeNull();

    await ingest.insertEvents([row!]);

    const { rows } = await pool.query(
      'SELECT event_name, environment, network, properties, created_at FROM events WHERE anonymous_id = $1',
      [anonymousId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      event_name: 'raffle_viewed',
      environment: 'production',
      network: 'robinhood_testnet',
      properties: { raffle_id: '1' },
    });
    expect(rows[0]?.created_at).toBeInstanceOf(Date);
  });

  it('round-trips an error with a redacted metadata payload', async () => {
    const row = validateError({
      error_type: 'RafflePurchaseError',
      message: 'reverted',
      environment: 'production',
      network: 'robinhood_mainnet',
      anonymous_id: anonymousId,
      metadata: { raffle_id: '2', password: 'nope' },
    });
    expect(row).not.toBeNull();

    await ingest.insertErrors([row!]);

    const { rows } = await pool.query(
      'SELECT fingerprint, metadata FROM client_errors WHERE anonymous_id = $1',
      [anonymousId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.fingerprint).toHaveLength(32);
    expect(rows[0]?.metadata).toEqual({ raffle_id: '2' });
  });

  it('exposes grouped errors through the view', async () => {
    const { rows } = await pool.query(
      'SELECT fingerprint, occurrences, affected_users FROM client_error_groups WHERE fingerprint = $1',
      [validateError({
        error_type: 'RafflePurchaseError',
        message: 'reverted',
        environment: 'production',
        network: 'robinhood_mainnet',
        anonymous_id: anonymousId,
      })!.fingerprint],
    );
    expect(rows).toHaveLength(1);
    expect(Number(rows[0]?.occurrences)).toBeGreaterThanOrEqual(1);
  });
});
