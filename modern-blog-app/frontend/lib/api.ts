import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Posts API
export const postsAPI = {
  getAll: (page = 1, limit = 10) =>
    api.get(`/posts?page=${page}&limit=${limit}`),
  getBySlug: (slug: string) =>
    api.get(`/posts/${slug}`),
  create: (data: any) =>
    api.post('/posts', data),
  update: (id: string, data: any) =>
    api.patch(`/posts/${id}`, data),
  delete: (id: string) =>
    api.delete(`/posts/${id}`),
};

// Projects API
export const projectsAPI = {
  getAll: () =>
    api.get('/projects'),
  getById: (id: string) =>
    api.get(`/projects/${id}`),
  create: (data: any) =>
    api.post('/projects', data),
  update: (id: string, data: any) =>
    api.patch(`/projects/${id}`, data),
  delete: (id: string) =>
    api.delete(`/projects/${id}`),
};

// Comments API
export const commentsAPI = {
  getAll: (page = 1, limit = 10) =>
    api.get(`/comments?page=${page}&limit=${limit}`),
  create: (data: any) =>
    api.post('/comments', data),
  approve: (id: string) =>
    api.patch(`/comments/${id}/approve`),
  delete: (id: string) =>
    api.delete(`/comments/${id}`),
};

// Users API
export const usersAPI = {
  getMe: () =>
    api.get('/users/me'),
  updateMe: (data: any) =>
    api.patch('/users/me', data),
  changePassword: (data: any) =>
    api.patch('/users/me/password', data),
  getById: (id: string) =>
    api.get(`/users/${id}`),
};

// Auth API
export const authAPI = {
  register: (data: any) =>
    api.post('/auth/register', data),
  login: (data: any) =>
    api.post('/auth/login', data),
  logout: () =>
    api.post('/auth/logout'),
};

export default api;
