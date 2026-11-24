import { useCallback, useEffect, useRef, useState } from 'react';
import {
  STATUSES,
  createApplication,
  deleteApplication,
  fetchApplications,
  fetchStats,
  updateApplication,
} from './api';
import ApplicationForm from './components/ApplicationForm';
import ApplicationList from './components/ApplicationList';
import Board from './components/Board';
import Dashboard from './components/Dashboard';
import { emptyApplication } from './format';

const VIEWS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'board', label: 'Board' },
  { id: 'list', label: 'List' },
];

export default function App() {
  const [view, setView] = useState('dashboard');
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [ready, setReady] = useState(false);
  const hasLoaded = useRef(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadStats = useCallback(async () => {
    const nextStats = await fetchStats();
    setStats(nextStats);
  }, []);

  const loadApplications = useCallback(async (nextQuery, nextStatus) => {
    const data = await fetchApplications({ q: nextQuery, status: nextStatus });
    setApplications(data.applications);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadStats()
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      });
    return () => {
      cancelled = true;
    };
  }, [loadStats]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      loadApplications(query, status)
        .then(() => {
          if (!cancelled) setError('');
        })
        .catch((loadError) => {
          if (!cancelled) setError(loadError.message);
        })
        .finally(() => {
          if (!cancelled) {
            hasLoaded.current = true;
            setReady(true);
          }
        });
    }, hasLoaded.current ? 180 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, status, loadApplications]);

  async function refresh() {
    await Promise.all([loadStats(), loadApplications(query, status)]);
  }

  function openCreate() {
    setFormError('');
    setForm({ mode: 'create', initial: emptyApplication() });
  }

  function openEdit(application) {
    setFormError('');
    setForm({ mode: 'edit', initial: application });
  }

  function filterByStatus(nextStatus) {
    setStatus(nextStatus);
    setView('list');
  }

  async function handleSubmit(values) {
    setSaving(true);
    setFormError('');
    try {
      if (form.mode === 'create') await createApplication(values);
      else await updateApplication(form.initial.id, values);
      setForm(null);
      await refresh();
    } catch (submitError) {
      setFormError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(application, nextStatus) {
    if (application.status === nextStatus) return;
    const previous = applications;
    setApplications((current) => current.map((item) => (
      item.id === application.id ? { ...item, status: nextStatus } : item
    )));
    try {
      await updateApplication(application.id, { ...application, status: nextStatus });
      await loadStats();
      if (status && status !== nextStatus) {
        await loadApplications(query, status);
      }
    } catch (updateError) {
      setApplications(previous);
      setError(updateError.message);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setError('');
    try {
      await deleteApplication(pendingDelete.id);
      setPendingDelete(null);
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeleting(false);
    }
  }

  const resultLabel = `${applications.length} application${applications.length === 1 ? '' : 's'}`;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true">JT</span>
          <div>
            <p className="brand-name">JobTrack</p>
            <p className="brand-tag">Every application, in one place.</p>
          </div>
        </div>
        <nav className="nav" aria-label="Views">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Add application
        </button>
      </header>

      <main>
        {error ? (
          <div className="banner" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setError('');
                refresh().catch((loadError) => setError(loadError.message));
              }}
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="page-head">
          <div>
            <h1>
              {view === 'dashboard' && 'Dashboard'}
              {view === 'board' && 'Status board'}
              {view === 'list' && 'Applications'}
            </h1>
            <p>
              {view === 'dashboard' && 'See where every application stands and which stage needs attention.'}
              {view === 'board' && 'Drag a card by its handle, or change the status menu, to move it along.'}
              {view === 'list' && 'Search by company, role, location, or notes, then filter by stage.'}
            </p>
          </div>
          {view !== 'dashboard' ? <p className="result-count">{ready ? resultLabel : 'Loading…'}</p> : null}
        </div>

        {view !== 'dashboard' ? (
          <div className="toolbar">
            <label className="search">
              <span className="sr-only">Search applications</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search company, role, location, or notes"
              />
            </label>
            <div className="chips" role="group" aria-label="Filter by status">
              <button
                type="button"
                className={status === '' ? 'chip active' : 'chip'}
                onClick={() => setStatus('')}
              >
                All
              </button>
              {STATUSES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={status === item ? 'chip active' : 'chip'}
                  onClick={() => setStatus(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {!ready ? <p className="muted">Loading your tracker…</p> : null}

        {ready && view === 'dashboard' ? (
          <Dashboard stats={stats} onFilter={filterByStatus} onEdit={openEdit} />
        ) : null}

        {ready && view === 'board' ? (
          <Board
            applications={applications}
            onEdit={openEdit}
            onDelete={setPendingDelete}
            onStatusChange={handleStatusChange}
          />
        ) : null}

        {ready && view === 'list' ? (
          applications.length === 0 && !query && !status ? (
            <div className="empty">
              <h2>No applications yet</h2>
              <p>Add the first role you want to track. It is stored in a local SQLite database.</p>
              <button type="button" className="btn btn-primary" onClick={openCreate}>Add application</button>
            </div>
          ) : (
            <ApplicationList
              applications={applications}
              onEdit={openEdit}
              onDelete={setPendingDelete}
            />
          )
        ) : null}

        <p className="footnote">Stored locally in SQLite on this computer. Nothing is sent to a remote server.</p>
      </main>

      {form ? (
        <ApplicationForm
          key={form.mode === 'edit' ? form.initial.id : 'new'}
          title={form.mode === 'create' ? 'Add application' : 'Edit application'}
          initial={form.initial}
          saving={saving}
          serverError={formError}
          onClose={() => {
            if (!saving) setForm(null);
          }}
          onSubmit={handleSubmit}
        />
      ) : null}

      {pendingDelete ? (
        <div className="backdrop" onMouseDown={() => { if (!deleting) setPendingDelete(null); }}>
          <div
            className="dialog confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="delete-title">Delete this application?</h2>
            <p>
              {pendingDelete.role} at {pendingDelete.company} will be removed from the tracker.
            </p>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger solid" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
