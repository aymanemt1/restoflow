import api from './client';

// Laravel APIs often wrap payloads in { data } — accept both shapes.
const one = (res) => {
  const d = res.data;
  if (d && typeof d === 'object' && !Array.isArray(d) && 'data' in d) return d.data ?? d;
  return d;
};

const many = (res) => {
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
};

const crud = (base) => ({
  list: (params) => api.get(base, { params }).then(many),
  get: (id) => api.get(`${base}/${id}`).then(one),
  create: (payload) => api.post(base, payload).then(one),
  update: (id, payload) => api.put(`${base}/${id}`, payload).then(one),
  remove: (id) => api.delete(`${base}/${id}`),
});

export const authApi = {
  login: (email, password) => api.post('/api/login', { email, password }).then(one),
  me: () => api.get('/api/me').then(one),
  logout: () => api.post('/api/logout'),
};

export const dashboardApi = {
  summary: () => api.get('/api/dashboard').then(one),
};

export const tablesApi = crud('/api/tables');
export const categoriesApi = crud('/api/categories');
export const menuItemsApi = crud('/api/menu-items');
export const reservationsApi = crud('/api/reservations');
export const usersApi = crud('/api/users');

export const ordersApi = {
  ...crud('/api/orders'),
  create: (table_id) => api.post('/api/orders', { table_id }).then(one),
  addItem: (id, menu_item_id, qty) =>
    api.post(`/api/orders/${id}/items`, { menu_item_id, qty }).then(one),
  setStatus: (id, status) => api.patch(`/api/orders/${id}/status`, { status }).then(one),
  pay: (id) => api.post(`/api/orders/${id}/pay`).then(one),
};
