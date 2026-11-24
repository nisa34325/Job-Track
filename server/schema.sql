-- Applications tracked in JobTrack.
-- status stays aligned with the four stages shown in the UI.

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  salary TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('Applied', 'Interview', 'Selected', 'Rejected')),
  applied_date TEXT NOT NULL,
  job_url TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_date ON applications (applied_date);
