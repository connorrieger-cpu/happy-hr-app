-- Community daily specials: a deal on certain days of the week (a Tuesday
-- burger) rather than a happy-hour window.

-- 'happy-hour' or 'daily'.
ALTER TABLE submissions ADD COLUMN kind TEXT NOT NULL DEFAULT 'happy-hour';
-- A daily special's name, e.g. "Taco Tuesday".
ALTER TABLE submissions ADD COLUMN title TEXT;
-- A daily special that runs all day is stored with start_min = end_min = 0.
