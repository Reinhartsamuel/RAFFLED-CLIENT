# Raffled tracker (Phase 1: data model + ingestion API)

A self-contained, first-party observability service. It is a separate package
inside this repository with its own `package.json` so the Vercel SPA build never
pulls in `fastify`/`pg`. There is no third-party analytics platform, no queue,
and no second database engine.

Phase 1 ships **only** the schema and the ingestion API. There is no dashboard,
no CI/CD, and no frontend instrumentation yet.

```
Browser (Vite SPA, Vercel)                 tracker/ (VPS, Docker)
  src/tracker/  (Phase 2)  ── POST /v1/* ──▶  Fastify + pg  ──▶  PostgreSQL 16
```

## What is collected

| Table | What it holds |
|---|---|
| `events` | Product events from the event registry (`shared/events.ts`), e.g. `page_viewed`, `raffle_viewed`, `transaction_failed` |
| `client_errors` | Uncaught errors / rejections with a `fingerprint` for grouping |
| `performance_measurements` | Web Vitals and API timing (`metric_name`, `value`, `unit`) |

Every row carries `environment`, `network`, `release`, and `commit_sha`. Sessions
are **derived** (`GROUP BY session_id`) — there is no `sessions` table. Grouped
errors come from the `client_error_groups` view — there is no second write path.

`user_ref` is `null` by default. If the client chooses to send it, it must be a
salted hash of the wallet address; it is untrusted analytics data and is never
used for authorization.

## Why it is safe to be this dumb

The client is fire-and-forget and never awaited: a tracker or Postgres outage
cannot affect raffles. Ingestion failures return 5xx and the app does not care.

## Redaction rules

`properties` and `metadata` are sanitized server-side:

- Keys matching the denylist (case- and separator-insensitive) are **dropped**,
  not masked: `password`, `passwd`, `secret`, `privatekey`, `private_key`,
  `mnemonic`, `seed`, `seedphrase`, `token`, `access_token`, `refresh_token`,
  `authorization`, `cookie`, `apikey`, `api_key`, `signature`, `signedmessage`,
  `email`, `phone`, `ip`.
- Limits: ≤ 30 keys, depth ≤ 3, strings ≤ 512 chars, serialized ≤ 4096 bytes.
- Unknown property keys are stripped against the per-event registry; a missing
  required key rejects just that row.

Field limits: `message` ≤ 2000, `stack` ≤ 8192, `url` ≤ 2048, `route` ≤ 256,
`user_agent` ≤ 512 (always taken from the request header, never the payload).
Body cap is 64 KiB; batches are capped at 50 events / 20 errors / 50
measurements. `POST` endpoints answer `202 {accepted, rejected}` and only reject
whole requests on a malformed envelope (400), an oversized body (413), or rate
limiting (429).

## Retention

Default retention is **90 days** per table (Phase 4 job). Raw rows only: no
partitioning and no rollups. `anonymous_id` is a persistent identifier stored in
the browser for 180 days; see below.

## Run locally

```bash
cd tracker
cp .env.example .env            # then set DATABASE_URL
bun install
bun run typecheck
bun run lint
bun run test                    # DB tests run only if TRACKER_TEST_DATABASE_URL is set

# Create the schema
bun run migrate                 # node db/migrate.js up  (forward-only, advisory-locked)

# Start the service
bun run dev                     # http://localhost:8787
```

Smoke test:

```bash
curl -s localhost:8787/healthz

curl -s -X POST localhost:8787/v1/events \
  -H 'Content-Type: text/plain;charset=UTF-8' \
  -d '{"events":[{"event_name":"page_viewed","environment":"development","network":"robinhood_testnet","anonymous_id":"a1","properties":{"path":"/","password":"leak"}}]}'
```

The insert above lands with `{"path":"/"}` only — `password` is dropped.

## Migrations

`db/migrations/*.sql` applied in filename order by `db/migrate.js`, recorded in
`schema_migrations` under a Postgres advisory lock. Forward-only by design: a
rollback redeploys old code against the new schema, so no `down` exists.

## Environment variables

Names only — see `.env.example`. Security-sensitive values (`DATABASE_URL`,
`TRACKER_ADMIN_TOKEN`, the Phase 4 webhook URL) must never reach the browser
bundle.

## Two limitations, stated plainly

1. **No source maps.** The Vite build emits none, so stack frames are minified.
   Fingerprints therefore key on `error_type + normalized message + normalized
   top frame + release`, which is stable within a release. Symbolication is
   deliberately not built. `release` is part of the fingerprint so "did this
   error start after deploy X?" is answerable.
2. **No backend request correlation.** Joining `request_id` into `api.winr.fun`
   server logs requires the backend repository to accept and echo
   `X-Request-ID`. Correlation is limited to the client-observed chain: user
   action → event → `request_id` → tracker perf row → tx hash → explorer.

Note also: `robinhood_mainnet` (chain 4663) is not registered in
`src/config/evm.config.tsx`, so no traffic can produce that network until it is
added — a separate, deliberate change.
