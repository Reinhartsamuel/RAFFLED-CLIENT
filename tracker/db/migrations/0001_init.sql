-- 0001_init.sql
-- Forward-only. Raw rows only: sessions and error groups are query concepts,
-- not stored entities. All timestamps are TIMESTAMPTZ.

CREATE TABLE events (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),   -- server receipt time
  client_ts     TIMESTAMPTZ,                          -- browser time (untrusted)
  event_name    TEXT NOT NULL,
  anonymous_id  TEXT,
  session_id    TEXT,
  user_ref      TEXT,                                 -- salted hash of wallet, or NULL
  environment   TEXT NOT NULL,
  network       TEXT NOT NULL,
  release       TEXT,
  commit_sha    TEXT,
  url           TEXT,
  route         TEXT,
  request_id    TEXT,
  properties    JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_agent    TEXT                                  -- derived from request header
);
CREATE INDEX events_time_env_idx   ON events (created_at DESC, environment, network);
CREATE INDEX events_name_time_idx  ON events (event_name, created_at DESC);
CREATE INDEX events_session_idx    ON events (session_id);
CREATE INDEX events_anon_idx       ON events (anonymous_id);

CREATE TABLE client_errors (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_ts     TIMESTAMPTZ,
  error_type    TEXT NOT NULL,
  message       TEXT NOT NULL,
  stack         TEXT,
  anonymous_id  TEXT,
  session_id    TEXT,
  user_ref      TEXT,
  environment   TEXT NOT NULL,
  network       TEXT NOT NULL,
  release       TEXT,
  commit_sha    TEXT,
  url           TEXT,
  route         TEXT,
  request_id    TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  fingerprint   TEXT NOT NULL,
  user_agent    TEXT
);
CREATE INDEX client_errors_time_env_idx  ON client_errors (created_at DESC, environment, network);
CREATE INDEX client_errors_fp_idx        ON client_errors (fingerprint, created_at DESC);
CREATE INDEX client_errors_session_idx   ON client_errors (session_id);

CREATE TABLE performance_measurements (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_ts     TIMESTAMPTZ,
  metric_name   TEXT NOT NULL,
  value         DOUBLE PRECISION NOT NULL,
  unit          TEXT NOT NULL,
  anonymous_id  TEXT,
  session_id    TEXT,
  user_ref      TEXT,
  environment   TEXT NOT NULL,
  network       TEXT NOT NULL,
  release       TEXT,
  commit_sha    TEXT,
  url           TEXT,
  route         TEXT,
  request_id    TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_agent    TEXT
);
CREATE INDEX perf_time_env_idx     ON performance_measurements (created_at DESC, environment, network);
CREATE INDEX perf_metric_time_idx ON performance_measurements (metric_name, created_at DESC);

-- Error grouping for the dashboard (Phase 3) without dual-write.
CREATE VIEW client_error_groups AS
SELECT fingerprint,
       max(environment)                       AS environment,
       max(network)                           AS network,
       max(error_type)                        AS error_type,
       max(message)                           AS sample_message,
       count(*)                               AS occurrences,
       count(DISTINCT anonymous_id)           AS affected_users,
       min(created_at)                        AS first_seen,
       max(created_at)                        AS last_seen,
       (array_agg(release ORDER BY created_at DESC))[1] AS latest_release,
       (array_agg(id ORDER BY created_at DESC))[1]      AS latest_id
FROM client_errors
GROUP BY fingerprint;
