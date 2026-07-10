import axios from 'axios';

interface Post {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category?: string;
  published?: boolean;
  published_at?: string;
  author?: string;
  read_time_minutes?: number;
  view_count?: number;
}

interface Comment {
  id?: string;
  post_id: string;
  author: string;
  content: string;
  created_at?: string;
}

interface User {
  id?: string;
  email: string;
  name?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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
  create: (data: Post) =>
    api.post('/posts', data),
  update: (id: string, data: Post) =>
    api.patch(`/posts/${id}`, data),
  delete: (id: string) =>
    api.delete(`/posts/${id}`),
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
