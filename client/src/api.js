export const STATUSES = ['Applied', 'Interview', 'Selected', 'Rejected'];

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'The request failed. Check that the API is running.');
  }
  return data;
}

export function fetchStats() {
  return request('/api/stats');
}

export function fetchApplications({ q = '', status = '' } = {}) {
  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());
  if (status) params.set('status', status);
  const query = params.toString();
  return request(`/api/applications${query ? `?${query}` : ''}`);
}

export function createApplication(application) {
  return request('/api/applications', {
    method: 'POST',
    body: JSON.stringify(application),
  });
}

export function updateApplication(id, application) {
  return request(`/api/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(application),
  });
}

export function deleteApplication(id) {
  return request(`/api/applications/${id}`, { method: 'DELETE' });
}
