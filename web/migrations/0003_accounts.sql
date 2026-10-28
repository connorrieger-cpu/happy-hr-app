-- Accounts: sign in with a 6-digit code sent by email, and favourites that
-- follow you to every device. Codes and session tokens are only stored hashed.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  -- Lowercased.
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- One live code per email; asking again replaces it.
CREATE TABLE sign_in_codes (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Every code sent, for rate limits.
CREATE TABLE code_requests (
  email TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX code_requests_by_email ON code_requests (email, created_at);
CREATE INDEX code_requests_by_ip ON code_requests (ip_hash, created_at);

-- A signed-in device.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  -- The app's anonymous device id, when it sent one.
  device TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  last_used_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX sessions_by_user ON sessions (user_id);

CREATE TABLE favourites (
  user_id TEXT NOT NULL,
  -- A listed venue id, or 'c-<submission id>' for a community-added place.
  venue_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (user_id, venue_id)
);
