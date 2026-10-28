-- Sign in with Apple, and the group chat.

-- Accounts can now come from Apple, which may not share an email, so email
-- becomes optional. SQLite can't relax NOT NULL in place, so the table is rebuilt
-- (ids are kept, so sessions and favourites still point at the right people).
CREATE TABLE users_v2 (
  id TEXT PRIMARY KEY,
  -- Lowercased; null for an Apple account that didn't share one.
  email TEXT UNIQUE,
  -- Apple's stable user id ("sub") for Sign in with Apple.
  apple_sub TEXT UNIQUE,
  -- Apple's refresh token, kept only to revoke access when the account is deleted.
  apple_refresh_token TEXT,
  -- The name shown in the chat.
  display_name TEXT,
  -- When they agreed to the chat rules.
  chat_rules_at TEXT,
  -- 1 when the owner has removed them from the chat.
  chat_banned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
INSERT INTO users_v2 (id, email, created_at) SELECT id, email, created_at FROM users;
DROP TABLE users;
ALTER TABLE users_v2 RENAME TO users;

CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  -- 1 when deleted by its writer, hidden by the owner, or hidden after several reports.
  hidden INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT NOT NULL
);

CREATE INDEX chat_by_user ON chat_messages (user_id, created_at);

CREATE TABLE chat_reports (
  message_id INTEGER NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  -- 1 once the owner has dealt with it.
  resolved INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (message_id, reporter_id)
);

CREATE INDEX chat_reports_open ON chat_reports (resolved, created_at);

-- Someone has hidden another person's messages from their own view.
CREATE TABLE chat_blocks (
  user_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (user_id, blocked_id)
);
