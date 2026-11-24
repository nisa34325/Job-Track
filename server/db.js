import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'jobtrack.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec(readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

export const STATUSES = ['Applied', 'Interview', 'Selected', 'Rejected'];

const SAMPLE_APPLICATIONS = [
  ['Northwind Labs', 'Frontend Engineer', 'Remote', '$128,000', 'Interview', '2026-11-12', 'https://example.com/jobs/northwind', 'Recruiter screen went well. Panel interview is next Thursday.'],
  ['Harbor & Co.', 'Product Designer', 'New York, NY', '$115,000', 'Applied', '2026-11-20', 'https://example.com/jobs/harbor', 'Portfolio link sent with the application.'],
  ['Lumen Health', 'Full Stack Engineer', 'Austin, TX', '$140,000', 'Selected', '2026-10-02', 'https://example.com/jobs/lumen', 'Offer received. Start date still open.'],
  ['Paperkite', 'Backend Engineer', 'Remote', '$132,000', 'Rejected', '2026-11-03', 'https://example.com/jobs/paperkite', 'Hiring manager passed after the technical screen.'],
  ['Fieldnote', 'Data Analyst', 'Chicago, IL', '$96,000', 'Interview', '2026-11-18', 'https://example.com/jobs/fieldnote', 'SQL exercise due Monday.'],
  ['Brightpath Schools', 'Software Engineer', 'Boston, MA', '$110,000', 'Applied', '2026-11-22', '', 'Hybrid role, three days on site.'],
  ['Copperlane', 'QA Engineer', 'Denver, CO', '$90,000', 'Rejected', '2026-09-15', 'https://example.com/jobs/copperlane', 'Role was filled internally.'],
  ['Marlowe Studio', 'UI Engineer', 'Remote', '$122,000', 'Selected', '2026-10-28', 'https://example.com/jobs/marlowe', 'Accepted the offer. Waiting on the written letter.'],
];

function seedIfEmpty() {
  const row = db.prepare('SELECT COUNT(*) AS total FROM applications').get();
  if (Number(row.total) > 0) return;

  const insert = db.prepare(`
    INSERT INTO applications (company, role, location, salary, status, applied_date, job_url, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    for (const sample of SAMPLE_APPLICATIONS) insert.run(...sample);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

seedIfEmpty();

function mapApplication(row) {
  return {
    id: Number(row.id),
    company: row.company,
    role: row.role,
    location: row.location,
    salary: row.salary,
    status: row.status,
    applied_date: row.applied_date,
    job_url: row.job_url,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const listStatement = db.prepare(`
  SELECT id, company, role, location, salary, status, applied_date, job_url, notes, created_at, updated_at
  FROM applications
  WHERE (
    ? = ''
    OR company LIKE ? ESCAPE '\\' COLLATE NOCASE
    OR role LIKE ? ESCAPE '\\' COLLATE NOCASE
    OR location LIKE ? ESCAPE '\\' COLLATE NOCASE
    OR notes LIKE ? ESCAPE '\\' COLLATE NOCASE
  )
  AND (? = '' OR status = ?)
  ORDER BY date(applied_date) DESC, id DESC
`);

const statsStatement = db.prepare(`
  SELECT
    COUNT(*) AS total,
    COALESCE(SUM(CASE WHEN status = 'Applied' THEN 1 ELSE 0 END), 0) AS applied,
    COALESCE(SUM(CASE WHEN status = 'Interview' THEN 1 ELSE 0 END), 0) AS interview,
    COALESCE(SUM(CASE WHEN status = 'Selected' THEN 1 ELSE 0 END), 0) AS selected,
    COALESCE(SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END), 0) AS rejected,
    COALESCE(SUM(CASE WHEN applied_date >= date('now', 'start of month') THEN 1 ELSE 0 END), 0) AS this_month
  FROM applications
`);

const recentStatement = db.prepare(`
  SELECT id, company, role, location, salary, status, applied_date, job_url, notes, created_at, updated_at
  FROM applications
  ORDER BY date(applied_date) DESC, id DESC
  LIMIT 5
`);

const byIdStatement = db.prepare(`
  SELECT id, company, role, location, salary, status, applied_date, job_url, notes, created_at, updated_at
  FROM applications
  WHERE id = ?
`);

const insertStatement = db.prepare(`
  INSERT INTO applications (company, role, location, salary, status, applied_date, job_url, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateStatement = db.prepare(`
  UPDATE applications
  SET company = ?,
      role = ?,
      location = ?,
      salary = ?,
      status = ?,
      applied_date = ?,
      job_url = ?,
      notes = ?,
      updated_at = datetime('now')
  WHERE id = ?
`);

const deleteStatement = db.prepare('DELETE FROM applications WHERE id = ?');

function likeTerm(query) {
  const escaped = query.replace(/[\\%_]/g, (character) => `\\${character}`);
  return `%${escaped}%`;
}

export function listApplications({ q = '', status = '' } = {}) {
  const term = q.trim();
  const like = likeTerm(term);
  return listStatement
    .all(term, like, like, like, like, status, status)
    .map(mapApplication);
}

export function getStats() {
  const row = statsStatement.get();
  const total = Number(row.total);
  const selected = Number(row.selected);
  const interview = Number(row.interview);
  const rejected = Number(row.rejected);
  const movedPastApplied = interview + selected + rejected;

  return {
    total,
    applied: Number(row.applied),
    interview,
    selected,
    rejected,
    thisMonth: Number(row.this_month),
    responseRate: total === 0 ? 0 : Math.round((movedPastApplied / total) * 100),
    selectionRate: total === 0 ? 0 : Math.round((selected / total) * 100),
    recent: recentStatement.all().map(mapApplication),
  };
}

export function getApplication(id) {
  const row = byIdStatement.get(id);
  return row ? mapApplication(row) : null;
}

export function createApplication(input) {
  const result = insertStatement.run(
    input.company,
    input.role,
    input.location,
    input.salary,
    input.status,
    input.applied_date,
    input.job_url,
    input.notes,
  );
  return getApplication(Number(result.lastInsertRowid));
}

export function updateApplication(id, input) {
  const result = updateStatement.run(
    input.company,
    input.role,
    input.location,
    input.salary,
    input.status,
    input.applied_date,
    input.job_url,
    input.notes,
    id,
  );
  if (Number(result.changes) === 0) return null;
  return getApplication(id);
}

export function deleteApplication(id) {
  const result = deleteStatement.run(id);
  return Number(result.changes) > 0;
}
