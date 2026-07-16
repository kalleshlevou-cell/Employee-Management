// In Docker the nginx config proxies /api/* to backend.
// In local dev, Vite proxies /api to localhost:5000 (configured in vite.config.ts).
const BASE_URL = '/api';

interface RequestOptions extends RequestInit {
  body?: any;
}

export const apiRequest = async (path: string, options: RequestOptions = {}) => {
  const token = localStorage.getItem('ems_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  // If the body is FormData (e.g. for CSV uploads), we should NOT set Content-Type
  if (options.body instanceof FormData) {
    if (headers['Content-Type']) {
      delete headers['Content-Type'];
    }
  } else if (options.body) {
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { message: text || 'An error occurred' };
  }

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  get: (path: string) => apiRequest(path, { method: 'GET' }),
  post: (path: string, body?: any) => apiRequest(path, { method: 'POST', body }),
  put: (path: string, body?: any) => apiRequest(path, { method: 'PUT', body }),
  patch: (path: string, body?: any) => apiRequest(path, { method: 'PATCH', body }),
  delete: (path: string) => apiRequest(path, { method: 'DELETE' }),
};
