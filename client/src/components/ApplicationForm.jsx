import { useEffect, useId, useState } from 'react';
import { STATUSES } from '../api';

function validate(values) {
  const errors = {};
  if (!values.company.trim()) errors.company = 'Company is required.';
  if (!values.role.trim()) errors.role = 'Role is required.';
  if (!values.applied_date) errors.applied_date = 'Applied date is required.';
  if (values.job_url.trim() && !/^https?:\/\/\S+$/i.test(values.job_url.trim())) {
    errors.job_url = 'Enter a full URL starting with http:// or https://.';
  }
  return errors;
}

export default function ApplicationForm({ initial, title, saving, serverError, onClose, onSubmit }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit({
      company: values.company.trim(),
      role: values.role.trim(),
      location: values.location.trim(),
      salary: values.salary.trim(),
      status: values.status,
      applied_date: values.applied_date,
      job_url: values.job_url.trim(),
      notes: values.notes.trim(),
    });
  }

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="dialog-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </header>
        <form onSubmit={handleSubmit} className="form-grid" noValidate>
          <label>
            Company
            <input
              autoFocus
              maxLength={120}
              value={values.company}
              onChange={(event) => update('company', event.target.value)}
              aria-invalid={Boolean(errors.company)}
            />
            {errors.company ? <span className="field-error">{errors.company}</span> : null}
          </label>
          <label>
            Role
            <input
              maxLength={120}
              value={values.role}
              onChange={(event) => update('role', event.target.value)}
              aria-invalid={Boolean(errors.role)}
            />
            {errors.role ? <span className="field-error">{errors.role}</span> : null}
          </label>
          <label>
            Location
            <input
              maxLength={120}
              value={values.location}
              onChange={(event) => update('location', event.target.value)}
              placeholder="Remote, city, or hybrid"
            />
          </label>
          <label>
            Salary
            <input
              maxLength={60}
              value={values.salary}
              onChange={(event) => update('salary', event.target.value)}
              placeholder="$120,000"
            />
          </label>
          <label>
            Status
            <select value={values.status} onChange={(event) => update('status', event.target.value)}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label>
            Applied date
            <input
              type="date"
              value={values.applied_date}
              onChange={(event) => update('applied_date', event.target.value)}
              aria-invalid={Boolean(errors.applied_date)}
            />
            {errors.applied_date ? <span className="field-error">{errors.applied_date}</span> : null}
          </label>
          <label className="full">
            Job URL
            <input
              maxLength={500}
              value={values.job_url}
              onChange={(event) => update('job_url', event.target.value)}
              placeholder="https://"
              aria-invalid={Boolean(errors.job_url)}
            />
            {errors.job_url ? <span className="field-error">{errors.job_url}</span> : null}
          </label>
          <label className="full">
            Notes
            <textarea
              maxLength={2000}
              rows={4}
              value={values.notes}
              onChange={(event) => update('notes', event.target.value)}
              placeholder="Recruiter name, follow-up date, interview feedback…"
            />
          </label>
          {serverError ? <p className="field-error full">{serverError}</p> : null}
          <div className="form-actions full">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
