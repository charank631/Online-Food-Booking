/**
 * Typed API client — all server calls in one place.
 * Base URL switches between dev (localhost:8000) and Docker (/api/v1 via nginx).
 */
import { MenuItem } from '../types';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

function getToken(): string | null {
  return localStorage.getItem('foodrush_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  register: (data: object) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: object) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  me: () => request('/auth/me'),
  
  users: (role?: string) => request(`/auth/users${role ? `?role=${role}` : ''}`),
};

// ── Restaurants ───────────────────────────────────────────────────
export const restaurantApi = {
  list: () => request('/restaurants/'),

  get: (id: string) => request(`/restaurants/${id}`),

  create: (data: object) =>
    request('/restaurants/', { method: 'POST', body: JSON.stringify(data) }),

  adminCreate: (data: object) =>
    request('/restaurants/admin-create', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: object) =>
    request(`/restaurants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  myRestaurants: () => request('/restaurants/my/restaurants'),
};

export const menuApi = {
  getMenu: (restaurantId: string) => request(`/restaurants/${restaurantId}/menu`),
  create: (restaurantId: string, item: Partial<MenuItem>) =>
    request(`/restaurants/${restaurantId}/menu`, { method: 'POST', body: JSON.stringify(item) }),
  update: (itemId: string, item: Partial<MenuItem>) =>
    request(`/menu/${itemId}`, { method: 'PATCH', body: JSON.stringify(item) }),
  delete: (itemId: string) =>
    request(`/menu/${itemId}`, { method: 'DELETE' }),
};

// ── Orders ────────────────────────────────────────────────────────
export const orderApi = {
  place: (data: object) =>
    request('/orders/', { method: 'POST', body: JSON.stringify(data) }),

  list: () => request('/orders/'),

  get: (id: string) => request(`/orders/${id}`),

  updateStatus: (id: string, status: string) =>
    request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  cancel: (id: string) =>
    request(`/orders/${id}/cancel`, { method: 'DELETE' }),

  assign: (id: string, agentId: string) =>
    request(`/orders/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ delivery_agent_id: agentId }),
    }),

  accept: (id: string) =>
    request(`/orders/${id}/accept`, { method: 'PATCH' }),

  revoke: (id: string) =>
    request(`/orders/${id}/revoke`, { method: 'PATCH' }),
};

// ── Payments ──────────────────────────────────────────────────────
export const paymentApi = {
  initiate: (orderId: string, method: string) =>
    request('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, method }),
    }),

  get: (orderId: string) => request(`/payments/${orderId}`),
};

// ── Dashboard ─────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => request('/dashboard/stats'),
};
