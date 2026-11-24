import { formatDate, hueFromText, initials } from '../format';
import StatusPill from './StatusPill';

export default function ApplicationList({ applications, onEdit, onDelete }) {
  if (applications.length === 0) {
    return (
      <div className="empty">
        <h2>No applications match</h2>
        <p>Try another search, clear the status filter, or add a new application.</p>
      </div>
    );
  }

  return (
    <ul className="job-list">
      {applications.map((application) => (
        <li key={application.id} className="job-row">
          <div className="identity">
            <span
              className="avatar"
              style={{ background: `hsl(${hueFromText(application.company)} 38% 38%)` }}
            >
              {initials(application.company)}
            </span>
            <div>
              <strong>{application.role}</strong>
              <span>{application.company}</span>
            </div>
          </div>
          <div className="cell">
            <span className="cell-label">Location</span>
            {application.location || '—'}
          </div>
          <div className="cell">
            <span className="cell-label">Applied</span>
            {formatDate(application.applied_date)}
          </div>
          <div className="cell">
            <span className="cell-label">Salary</span>
            {application.salary || '—'}
          </div>
          <StatusPill status={application.status} />
          <div className="row-actions">
            {application.job_url ? (
              <a className="text-link" href={application.job_url} target="_blank" rel="noreferrer">
                Posting
              </a>
            ) : null}
            <button type="button" className="btn btn-ghost" onClick={() => onEdit(application)}>Edit</button>
            <button type="button" className="btn btn-danger" onClick={() => onDelete(application)}>Delete</button>
          </div>
          {application.notes ? <p className="row-notes">{application.notes}</p> : null}
        </li>
      ))}
    </ul>
  );
}
