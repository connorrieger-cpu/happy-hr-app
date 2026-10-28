-- Anonymous usage counts for the owner's Usage screen (rules in src/lib/usage.ts): daily
-- totals per area, where the apps were opened (squares about 550 m or 5.5 km across, never
-- exact spots) and which buttons were tapped. Nothing here links to an account.

CREATE TABLE usage_events (
  -- Toronto date, YYYY-MM-DD.
  day TEXT NOT NULL,
  area TEXT NOT NULL,
  -- 'ios' or 'web'.
  platform TEXT NOT NULL,
  -- 'open', 'venue', 'tile:beer'…
  name TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, area, platform, name)
);

CREATE TABLE usage_cells (
  day TEXT NOT NULL,
  area TEXT NOT NULL,
  -- A square's centre, "43.6475,-79.4185".
  cell TEXT NOT NULL,
  opens INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, area, cell)
);

-- To count phones a day: a salted hash of the app's anonymous device id, deleted after 90 days.
CREATE TABLE usage_devices (
  day TEXT NOT NULL,
  area TEXT NOT NULL,
  device_hash TEXT NOT NULL,
  PRIMARY KEY (day, area, device_hash)
);

-- Rate limit: reports per network a day (a salted IP hash), deleted after a few days.
CREATE TABLE usage_calls (
  day TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, ip_hash)
);
