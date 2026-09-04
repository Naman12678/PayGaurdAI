/**
 * Dashboard → core-api HTTP client.
 * All requests include Authorization: Bearer <token> from sessionStorage.
 */

const BASE = import.meta.env.VITE_CORE_API_URL || 'http://localhost:4000';

function authHeaders() {
  const token = sessionStorage.getItem('jwt');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 401) {
    // Token expired or invalid — clear session and redirect to login
    sessionStorage.removeItem('jwt');
    sessionStorage.removeItem('merchant');
    window.location.href = '/login';
    throw new Error('Session expired.');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `${method} ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed.');
  return data; // { token, merchant }
}

export async function register(email, password, name) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed.');
  return data; // { token, merchant }
}

export async function getMe() {
  return request('GET', '/auth/me');
}

export async function fetchAuditLog({ limit = 50, offset = 0, sessionId } = {}) {
  const params = new URLSearchParams({ limit, offset });
  if (sessionId) params.set('sessionId', sessionId);
  return request('GET', `/audit?${params}`);
}

export async function fetchPolicy() {
  return request('GET', '/policy');
}

export async function updatePolicy(data) {
  return request('PUT', '/policy', data);
}

export async function fetchCatalog() {
  return request('GET', '/.well-known/agent-catalog.json');
}

export async function restockProduct(sku, stock) {
  return request('PUT', `/catalog/${encodeURIComponent(sku)}`, { stock });
}
