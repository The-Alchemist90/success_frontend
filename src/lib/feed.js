import { ApiError, api } from './api'

function qs(params) {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') q.set(key, value)
  }
  const text = q.toString()
  return text ? `?${text}` : ''
}

export const feedApi = {
  list: ({ category, campus, cursor, limit = 10 } = {}) => api.get(`/posts${qs({ category, campus, cursor, limit })}`),
  campuses: () => api.get('/posts/campuses'),
  create: (body) => api.post('/posts', body),
  remove: (id) => api.delete(`/posts/${id}`),
  like: (id, on) => (on ? api.post(`/posts/${id}/like`) : api.delete(`/posts/${id}/like`)),
  comments: (id, cursor) => api.get(`/posts/${id}/comments${qs({ cursor, limit: 10 })}`),
  addComment: (id, content) => api.post(`/posts/${id}/comments`, { content }),
  removeComment: (id) => api.delete(`/comments/${id}`),
  likeComment: (id, on) => (on ? api.post(`/comments/${id}/like`) : api.delete(`/comments/${id}/like`)),
  report: (body) => api.post('/reports', body),
}

/** Translation key of the message to show for an API error. */
export function errorKey(err) {
  if (!(err instanceof ApiError)) return 'errors.generic'
  if (err.status === 0) return 'errors.network'
  if (err.status === 429) return 'errors.tooMany'
  if (err.status === 403) return 'feed.errors.forbidden'
  if (err.status === 404) return 'feed.errors.gone'
  if (err.status === 409) return 'feed.errors.duplicate'
  if (err.status === 422) return 'feed.errors.invalid'
  if (err.status === 503) return 'feed.errors.media'
  return 'errors.generic'
}