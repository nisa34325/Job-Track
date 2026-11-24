import { STATUSES } from '../api';
import { formatDate, hueFromText, initials } from '../format';
import StatusPill from './StatusPill';

export default function Dashboard({ stats, onFilter, onEdit }) {
  if (!stats) {
    return <p className="muted">Loading dashboard…</p>;
  }

  const counts = {
    Applied: stats.applied,
    Interview: stats.interview,
    Selected: stats.selected,
    Rejected: stats.rejected,
  };
  const largest = Math.max(...Object.values(counts));

  return (
    <div className="dashboard">
      <section className="stats-grid" aria-label="Application statistics">
        <button type="button" className="stat-card stat-total" onClick={() => onFilter('')}>
          <span>All applications</span>
          <strong>{stats.total}</strong>
          <em>{stats.thisMonth} added this month</em>
        </button>
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={`stat-card stat-${status.toLowerCase()}`}
            onClick={() => onFilter(status)}
          >
            <span>{status}</span>
            <strong>{counts[status]}</strong>
            <em>{stats.total === 0 ? '0%' : `${Math.round((counts[status] / stats.total) * 100)}%`} of total</em>
          </button>
        ))}
      </section>

      <section className="insight-grid">
        <article className="panel">
          <header className="panel-head">
            <h2>Pipeline</h2>
            <p>How your applications are spread across stages.</p>
          </header>
          <div className="pipeline" aria-hidden="true">
            {stats.total === 0 ? (
              <div className="pipeline-empty" />
            ) : (
              STATUSES.map((status) => (
                <div
                  key={status}
                  className={`pipeline-seg seg-${status.toLowerCase()}`}
                  style={{ flexGrow: counts[status] }}
                />
              ))
            )}
          </div>
          <ul className="legend">
            {STATUSES.map((status) => (
              <li key={status}>
                <i className={`swatch seg-${status.toLowerCase()}`} />
                {status}
                <b>{counts[status]}</b>
              </li>
            ))}
          </ul>
          <div className="rate-row">
            <div>
              <span>Response rate</span>
              <strong>{stats.responseRate}%</strong>
              <p>Moved past Applied</p>
            </div>
            <div>
              <span>Selection rate</span>
              <strong>{stats.selectionRate}%</strong>
              <p>Offers out of all applications</p>
            </div>
            <div>
              <span>Busiest stage</span>
              <strong>{STATUSES.reduce((best, status) => (counts[status] > counts[best] ? status : best), 'Applied')}</strong>
              <p>{stats.total === 0 ? 'No applications yet' : `${largest} at the busiest stage`}</p>
            </div>
          </div>
        </article>

        <article className="panel">
          <header className="panel-head">
            <h2>Latest activity</h2>
            <p>The five most recent application dates.</p>
          </header>
          {stats.recent.length === 0 ? (
            <p className="muted">Add an application to see it here.</p>
          ) : (
            <ul className="recent-list">
              {stats.recent.map((application) => (
                <li key={application.id}>
                  <button type="button" className="recent-item" onClick={() => onEdit(application)}>
                    <span
                      className="avatar"
                      style={{ background: `hsl(${hueFromText(application.company)} 38% 38%)` }}
                    >
                      {initials(application.company)}
                    </span>
                    <span className="recent-copy">
                      <strong>{application.role}</strong>
                      <span>{application.company} · {formatDate(application.applied_date)}</span>
                    </span>
                    <StatusPill status={application.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
