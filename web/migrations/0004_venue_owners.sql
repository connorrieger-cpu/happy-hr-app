-- Venue owners: a bar claims its page, the owner approves it and sends the bar
-- a private venue key, and deals posted with that key show as "From the venue".

CREATE TABLE claims (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL,
  -- Who's asking, their role ("owner", "manager"…) and how to reach them.
  name TEXT NOT NULL,
  role TEXT,
  contact TEXT NOT NULL,
  message TEXT,
  device TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  -- 'pending', 'approved' or 'rejected'.
  status TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX claims_by_status ON claims (status, created_at);

CREATE TABLE venue_keys (
  -- SHA-256 of the key; the key itself is only shown once, to the owner.
  key_hash TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL,
  claim_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  revoked INTEGER NOT NULL DEFAULT 0
);

-- 'community' or 'venue' (posted with a venue key).
ALTER TABLE submissions ADD COLUMN source TEXT NOT NULL DEFAULT 'community';
