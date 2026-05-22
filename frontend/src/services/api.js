import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ac_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ac_token');
      localStorage.removeItem('ac_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  adminLogin: (data) => API.post('/auth/admin/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  addAddress: (data) => API.post('/auth/addresses', data),
  deleteAddress: (id) => API.delete(`/auth/addresses/${id}`),
};

// Orders
export const orderAPI = {
  estimate: (data) => API.post('/orders/estimate', data),
  create: (data) => API.post('/orders', data),
  getMyOrders: (params) => API.get('/orders/my-orders', { params }),
  getOrder: (id) => API.get(`/orders/${id}`),
  rate: (id, data) => API.post(`/orders/${id}/rate`, data),
};

// Admin
export const adminAPI = {
  getAnalytics: () => API.get('/admin/analytics'),
  getOrders: (params) => API.get('/admin/orders', { params }),
  updateOrderStatus: (id, data) => API.patch(`/admin/orders/${id}/status`, data),
  assignDriver: (id, data) => API.patch(`/admin/orders/${id}/assign`, data),
  getDrivers: (params) => API.get('/admin/drivers', { params }),
  getAvailableDrivers: () => API.get('/admin/drivers/available'),
  createDriver: (data) => API.post('/admin/drivers', data),
  updateDriver: (id, data) => API.put(`/admin/drivers/${id}`, data),
  deleteDriver: (id) => API.delete(`/admin/drivers/${id}`),
  getUsers: (params) => API.get('/admin/users', { params }),
  toggleUser: (id) => API.patch(`/admin/users/${id}/toggle`),
};

export default API;
