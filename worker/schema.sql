CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week TEXT NOT NULL,
  pkey TEXT NOT NULL,
  name TEXT NOT NULL,
  wallet TEXT,
  kills INTEGER NOT NULL,
  deaths INTEGER NOT NULL,
  blue INTEGER NOT NULL,
  red INTEGER NOT NULL,
  won INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  points INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  ip_hash TEXT
);
CREATE INDEX IF NOT EXISTS matches_week_pkey ON matches (week, pkey);
CREATE INDEX IF NOT EXISTS matches_pkey ON matches (pkey);
