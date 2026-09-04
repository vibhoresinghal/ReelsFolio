-- ReelsFolio first-party analytics (Cloudflare D1)
-- Run once after creating the database, or let the worker create these on first request.

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  referrer TEXT,
  landing_path TEXT,
  device TEXT,
  os TEXT,
  browser TEXT,
  viewport TEXT,
  connection TEXT,
  language TEXT,
  timezone TEXT,
  reduced_motion INTEGER,
  ttfb_ms INTEGER,
  fcp_ms INTEGER,
  load_ms INTEGER,
  visitor_id TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  ts INTEGER NOT NULL,
  action TEXT NOT NULL,
  payload TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_action ON events(action);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON sessions(visitor_id);

CREATE TABLE IF NOT EXISTS likes (
  video_id TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);
