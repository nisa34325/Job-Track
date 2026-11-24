export function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function initials(company) {
  const parts = company
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((part) => part[0].toUpperCase()).join('') || '?';
}

export function hueFromText(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 360;
  }
  return hash;
}

export function emptyApplication() {
  return {
    company: '',
    role: '',
    location: '',
    salary: '',
    status: 'Applied',
    applied_date: todayIso(),
    job_url: '',
    notes: '',
  };
}
