-- Community updates: happy hours people add, and whether a deal worked.

CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  -- The listed venue this adds to; NULL when it's a new place.
  venue_id TEXT,
  venue_name TEXT NOT NULL,
  address TEXT,
  lat REAL,
  lng REAL,
  -- JSON array of weekdays, 0 = Sunday.
  days TEXT NOT NULL,
  -- Minutes after midnight, Toronto time; end may pass midnight (up to 1800).
  start_min INTEGER NOT NULL,
  end_min INTEGER NOT NULL,
  -- JSON array of { kind, item, price? }.
  specials TEXT NOT NULL,
  note TEXT,
  device TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  hidden INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX submissions_by_visibility ON submissions (hidden, created_at);
CREATE INDEX submissions_by_ip ON submissions (ip_hash, created_at);

CREATE TABLE votes (
  -- A listed venue id, or 'c-<submission id>' for a community-added place.
  venue_id TEXT NOT NULL,
  device TEXT NOT NULL,
  -- Toronto date; one vote per device per venue per day (a later vote replaces it).
  day TEXT NOT NULL,
  worked INTEGER NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  hidden INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (venue_id, device, day)
);

CREATE INDEX votes_by_time ON votes (hidden, created_at);
CREATE INDEX votes_by_ip ON votes (ip_hash, created_at);
