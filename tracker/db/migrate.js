// Forward-only migration runner.
//
//   node db/migrate.js up
//
// Applies every `migrations/*.sql` file that is not yet recorded in
// `schema_migrations`, in filename order, one transaction each, under a
// Postgres advisory lock so concurrent deploys cannot race. There is no
// `down`: migrations are additive, and old code must keep working on a new
// schema so a rollback never needs one.

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
const LOCK_KEY = 728194651;

/**
 * @param {{ query: (text: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }> }} client
 * @param {{ directory?: string, log?: (message: string) => void }} [options]
 * @returns {Promise<number>} number of migrations applied
 */
export async function runMigrations(client, options = {}) {
  const { directory = MIGRATIONS_DIR, log = () => {} } = options;

  await client.query(`SELECT pg_advisory_lock(${LOCK_KEY})`);
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name       TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
    );

    const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((row) => row.name));

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = await readFile(join(directory, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`migration ${file} failed: ${reason}`);
      }

      count += 1;
      log(`applied ${file}`);
    }

    return count;
  } finally {
    await client.query(`SELECT pg_advisory_unlock(${LOCK_KEY})`);
  }
}

const invokedDirectly =
  typeof process.argv[1] === 'string' &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const command = process.argv[2] ?? 'up';
  if (command !== 'up') {
    console.error('only "up" is supported (migrations are forward-only)');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const applied = await runMigrations(client, { log: (message) => console.log(message) });
    console.log(applied > 0 ? `${applied} migration(s) applied` : 'no pending migrations');
  } finally {
    await client.end();
  }
}
