import { useState } from 'react';
import { STATUSES } from '../api';
import { formatDate, hueFromText, initials } from '../format';

export default function Board({ applications, onEdit, onDelete, onStatusChange }) {
  const [dragOver, setDragOver] = useState('');

  function handleDrop(event, status) {
    event.preventDefault();
    setDragOver('');
    const id = Number(event.dataTransfer.getData('text/plain'));
    const application = applications.find((item) => item.id === id);
    if (!application || application.status === status) return;
    onStatusChange(application, status);
  }

  return (
    <div className="board">
      {STATUSES.map((status) => {
        const items = applications.filter((application) => application.status === status);
        return (
          <section
            key={status}
            className={`column ${dragOver === status ? 'drag-over' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={() => setDragOver((current) => (current === status ? '' : current))}
            onDrop={(event) => handleDrop(event, status)}
          >
            <header className="column-head">
              <h2>{status}</h2>
              <span>{items.length}</span>
            </header>
            <div className="column-body">
              {items.length === 0 ? <p className="column-empty">Drop an application here.</p> : null}
              {items.map((application) => (
                <article key={application.id} className="job-card">
                  <div className="card-top">
                    <span
                      className="drag-handle"
                      draggable
                      title="Drag to another column"
                      aria-label={`Move ${application.role} at ${application.company}`}
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', String(application.id));
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                    >
                      ::
                    </span>
                    <span
                      className="avatar"
                      style={{ background: `hsl(${hueFromText(application.company)} 38% 38%)` }}
                    >
                      {initials(application.company)}
                    </span>
                    <div>
                      <h3>{application.role}</h3>
                      <p>{application.company}</p>
                    </div>
                  </div>
                  <p className="card-meta">
                    {application.location || 'Location not set'} · {formatDate(application.applied_date)}
                  </p>
                  {application.salary ? <p className="card-salary">{application.salary}</p> : null}
                  <label className="status-label" htmlFor={`board-status-${application.id}`}>
                    Status
                    <select
                      id={`board-status-${application.id}`}
                      value={application.status}
                      onChange={(event) => onStatusChange(application, event.target.value)}
                    >
                      {STATUSES.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <div className="card-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => onEdit(application)}>Edit</button>
                    <button type="button" className="btn btn-danger" onClick={() => onDelete(application)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
