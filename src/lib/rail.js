import { api } from './api'

export const railApi = {
  stats: () => api.get('/users/me/stats'),
  notifications: (limit = 8) => api.get(`/users/me/notifications?limit=${limit}`),
  markRead: (id) => api.post(`/users/me/notifications/${id}/read`),
  markAllRead: () => api.post('/users/me/notifications/read-all'),
  courses: () => api.get('/users/me/courses?status=active&limit=3'),
  questions: () => api.get('/posts?category=question&limit=12'),
  post: (id) => api.get(`/posts/${id}`),
}