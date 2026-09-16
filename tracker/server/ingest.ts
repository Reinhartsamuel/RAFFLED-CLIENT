/**
 * Persistence. One multi-row INSERT per endpoint.
 *
 * No explicit BEGIN/COMMIT: a single statement is already atomic, and wrapping
 * `pool.query('BEGIN')` around separate calls would be wrong because a pool may
 * hand out a different connection per call.
 */

import type { ClientErrorRow, EventRow, PerfRow } from '../shared/types.ts';

export interface QueryResultLike {
  rowCount?: number | null;
  rows?: readonly unknown[];
}

export interface Queryable {
  query(text: string, values?: unknown[]): Promise<QueryResultLike>;
}

interface Statement {
  text: string;
  values: unknown[];
}

function buildInsert(table: string, columns: readonly string[], rows: readonly unknown[][]): Statement {
  let index = 1;
  const tuples = rows.map((row) => `(${row.map(() => `$${index++}`).join(', ')})`);
  return {
    text: `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${tuples.join(', ')}`,
    values: rows.flat(),
  };
}

const EVENT_COLUMNS = [
  'client_ts',
  'event_name',
  'anonymous_id',
  'session_id',
  'user_ref',
  'environment',
  'network',
  'release',
  'commit_sha',
  'url',
  'route',
  'request_id',
  'properties',
  'user_agent',
] as const;

const ERROR_COLUMNS = [
  'client_ts',
  'error_type',
  'message',
  'stack',
  'anonymous_id',
  'session_id',
  'user_ref',
  'environment',
  'network',
  'release',
  'commit_sha',
  'url',
  'route',
  'request_id',
  'metadata',
  'fingerprint',
  'user_agent',
] as const;

const PERF_COLUMNS = [
  'client_ts',
  'metric_name',
  'value',
  'unit',
  'anonymous_id',
  'session_id',
  'user_ref',
  'environment',
  'network',
  'release',
  'commit_sha',
  'url',
  'route',
  'request_id',
  'metadata',
  'user_agent',
] as const;

export class Ingest {
  constructor(private readonly db: Queryable) {}

  async insertEvents(rows: readonly EventRow[]): Promise<number> {
    if (rows.length === 0) return 0;
    const statement = buildInsert(
      'events',
      EVENT_COLUMNS,
      rows.map((row) => [
        row.client_ts,
        row.event_name,
        row.anonymous_id,
        row.session_id,
        row.user_ref,
        row.environment,
        row.network,
        row.release,
        row.commit_sha,
        row.url,
        row.route,
        row.request_id,
        JSON.stringify(row.properties),
        row.user_agent,
      ]),
    );
    await this.db.query(statement.text, statement.values);
    return rows.length;
  }

  async insertErrors(rows: readonly ClientErrorRow[]): Promise<number> {
    if (rows.length === 0) return 0;
    const statement = buildInsert(
      'client_errors',
      ERROR_COLUMNS,
      rows.map((row) => [
        row.client_ts,
        row.error_type,
        row.message,
        row.stack,
        row.anonymous_id,
        row.session_id,
        row.user_ref,
        row.environment,
        row.network,
        row.release,
        row.commit_sha,
        row.url,
        row.route,
        row.request_id,
        JSON.stringify(row.metadata),
        row.fingerprint,
        row.user_agent,
      ]),
    );
    await this.db.query(statement.text, statement.values);
    return rows.length;
  }

  async insertPerf(rows: readonly PerfRow[]): Promise<number> {
    if (rows.length === 0) return 0;
    const statement = buildInsert(
      'performance_measurements',
      PERF_COLUMNS,
      rows.map((row) => [
        row.client_ts,
        row.metric_name,
        row.value,
        row.unit,
        row.anonymous_id,
        row.session_id,
        row.user_ref,
        row.environment,
        row.network,
        row.release,
        row.commit_sha,
        row.url,
        row.route,
        row.request_id,
        JSON.stringify(row.metadata),
        row.user_agent,
      ]),
    );
    await this.db.query(statement.text, statement.values);
    return rows.length;
  }
}
