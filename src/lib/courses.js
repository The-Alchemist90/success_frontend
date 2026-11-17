import { api } from './api'

function qs(params) {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') q.set(key, value)
  }
  const text = q.toString()
  return text ? `?${text}` : ''
}

export const coursesApi = {
  list: ({ q, level, status, limit = 12, offset = 0 } = {}) => api.get(`/courses${qs({ q, level, status, limit, offset })}`),
  mine: ({ limit = 20, offset = 0 } = {}) => api.get(`/users/me/courses${qs({ status: 'active', limit, offset })}`),
  get: (id) => api.get(`/courses/${id}`),
  progress: (id) => api.get(`/courses/${id}/progress`),
  enroll: (id) => api.post(`/courses/${id}/enroll`),
  leave: (id) => api.delete(`/courses/${id}/enroll`),
  lesson: (id) => api.get(`/lessons/${id}`),
  saveProgress: (id, body) => api.put(`/lessons/${id}/progress`, body),
  setPublished: (id, value) => api.patch(`/courses/${id}`, { is_published: value }),
}

/** Bilingual text: the wanted language, else the other one. Returns { text, lang }. */
export function pick(map, lang) {
  if (!map) return { text: '', lang }
  if (map[lang]) return { text: map[lang], lang }
  const other = lang === 'fr' ? 'en' : 'fr'
  if (map[other]) return { text: map[other], lang: other }
  return { text: '', lang }
}
export const textOf = (map, lang) => pick(map, lang).text

// ------------------------------------------------------------------ covers
const COVERS = [
  'from-[#002f1c] via-[#0d5c3a] to-[#15803d]',
  'from-[#4a1d00] via-[#a73a00] to-[#ea580c]',
  'from-[#0c2a4d] via-[#1d4ed8] to-[#38bdf8]',
  'from-[#3b2a00] via-[#b45309] to-[#f59e0b]',
]
/** Every course gets its own colour, always the same one (no image to download). */
export function coverFor(code = '') {
  let hash = 0
  for (const ch of code) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return COVERS[hash % COVERS.length]
}

// ------------------------------------------------------------------- media
const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
export const mediaReady = Boolean(CLOUD)
const base = () => `https://res.cloudinary.com/${CLOUD}/video/upload`
export const videoUrl = (id) => `${base()}/c_limit,w_720,q_auto,f_auto/${id}`
export const videoPoster = (id) => `${base()}/so_0,c_limit,w_720,q_auto/${id.replace(/\.[a-z0-9]+$/i, '')}.jpg`
export const audioUrl = (id) => `${base()}/q_auto/${id.replace(/\.[a-z0-9]+$/i, '')}.mp3`

// ----------------------------------------------------------------- numbers
export function duration(minutes, t) {
  if (!minutes) return ''
  if (minutes < 60) return t('courses.min', { n: minutes })
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? t('courses.hourMin', { h: hours, m: rest }) : t('courses.hours', { n: hours })
}