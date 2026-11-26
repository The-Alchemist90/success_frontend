import { ApiError, api } from './api'
import { errorKey } from './feed'

function qs(params) {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') q.set(key, value)
  }
  const text = q.toString()
  return text ? `?${text}` : ''
}

export const netApi = {
  summary: () => api.get('/connections/summary'),
  friends: (q) => api.get(`/connections/friends${qs({ q })}`),
  people: ({ q, limit = 12, offset = 0 } = {}) => api.get(`/connections/people${qs({ q, limit, offset })}`),
  requests: (direction) => api.get(`/connections/requests?direction=${direction}`),
  sendRequest: (userId) => api.post('/connections/requests', { user_id: userId }),
  accept: (id) => api.post(`/connections/requests/${id}/accept`),
  reject: (id) => api.post(`/connections/requests/${id}/reject`),
  cancel: (id) => api.delete(`/connections/requests/${id}`),
  unfriend: (userId) => api.delete(`/connections/friends/${userId}`),
  blocks: () => api.get('/connections/blocks'),
  block: (userId) => api.post('/connections/blocks', { user_id: userId }),
  unblock: (userId) => api.delete(`/connections/blocks/${userId}`),
  conversations: () => api.get('/chat/conversations'),
  messages: (userId, { before, after, limit = 30 } = {}) => api.get(`/chat/${userId}/messages${qs({ before, after, limit })}`),
  send: (userId, content) => api.post(`/chat/${userId}/messages`, { content }),
  markRead: (userId) => api.post(`/chat/${userId}/read`),
}

/** Translation key of the message to show for an error. */
export function netErrorKey(err) {
  if (err instanceof ApiError) {
    if (err.status === 403) return 'friends.errors.notFriends'
    if (err.status === 404) return 'friends.errors.gone'
    if (err.status === 409) return 'friends.errors.already'
  }
  return errorKey(err)
}