const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors; // { title: 'Title must be ...' }
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running on port 5000?', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fieldErrors = {};
    (data.errors || []).forEach((e) => { if (!fieldErrors[e.field]) fieldErrors[e.field] = e.message; });
    throw new ApiError(data.message || 'Request failed', res.status, fieldErrors);
  }
  return data;
}

export const api = {
  list: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
    return request(`/posts${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/posts/${id}`),
  create: (post) => request('/posts', { method: 'POST', body: post }),
  update: (id, post) => request(`/posts/${id}`, { method: 'PUT', body: post }),
  remove: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
};
