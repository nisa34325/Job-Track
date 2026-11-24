import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import {
  STATUSES,
  createApplication,
  deleteApplication,
  getApplication,
  getStats,
  listApplications,
  updateApplication,
} from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'client', 'dist');
const port = Number(process.env.PORT) || 3001;

const app = express();
app.use(express.json({ limit: '32kb' }));

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function readApplication(body) {
  const company = String(body?.company ?? '').trim();
  const role = String(body?.role ?? '').trim();
  const location = String(body?.location ?? '').trim();
  const salary = String(body?.salary ?? '').trim();
  const status = String(body?.status ?? '').trim();
  const appliedDate = String(body?.applied_date ?? '').trim();
  const jobUrl = String(body?.job_url ?? '').trim();
  const notes = String(body?.notes ?? '').trim();

  if (!company) return { error: 'Company is required.' };
  if (company.length > 120) return { error: 'Company must be 120 characters or fewer.' };
  if (!role) return { error: 'Role is required.' };
  if (role.length > 120) return { error: 'Role must be 120 characters or fewer.' };
  if (location.length > 120) return { error: 'Location must be 120 characters or fewer.' };
  if (salary.length > 60) return { error: 'Salary must be 60 characters or fewer.' };
  if (!STATUSES.includes(status)) {
    return { error: 'Status must be Applied, Interview, Selected, or Rejected.' };
  }
  if (!isIsoDate(appliedDate)) return { error: 'Applied date must be a real date.' };
  if (jobUrl && !/^https?:\/\/\S+$/i.test(jobUrl)) {
    return { error: 'Job URL must start with http:// or https://.' };
  }
  if (jobUrl.length > 500) return { error: 'Job URL must be 500 characters or fewer.' };
  if (notes.length > 2000) return { error: 'Notes must be 2000 characters or fewer.' };

  return {
    value: {
      company,
      role,
      location,
      salary,
      status,
      applied_date: appliedDate,
      job_url: jobUrl,
      notes,
    },
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/stats', (_req, res) => {
  res.json(getStats());
});

app.get('/api/applications', (req, res) => {
  const q = String(req.query.q ?? '').slice(0, 100);
  const status = String(req.query.status ?? '');
  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Status must be Applied, Interview, Selected, or Rejected.' });
  }
  res.json({ applications: listApplications({ q, status }) });
});

app.get('/api/applications/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid application id.' });
  }
  const application = getApplication(id);
  if (!application) return res.status(404).json({ error: 'Application not found.' });
  res.json({ application });
});

app.post('/api/applications', (req, res) => {
  const parsed = readApplication(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const application = createApplication(parsed.value);
  res.status(201).json({ application });
});

app.put('/api/applications/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid application id.' });
  }
  const parsed = readApplication(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const application = updateApplication(id, parsed.value);
  if (!application) return res.status(404).json({ error: 'Application not found.' });
  res.json({ application });
});

app.delete('/api/applications/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid application id.' });
  }
  const removed = deleteApplication(id);
  if (!removed) return res.status(404).json({ error: 'Application not found.' });
  res.json({ ok: true });
});

if (existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(error);
  res.status(500).json({ error: 'Something went wrong while saving your applications.' });
});

app.listen(port, () => {
  console.log(`JobTrack API running at http://localhost:${port}`);
});
