
let accessToken = null
let refreshPromise = null
const sessionLostListeners = new Set()

export function setAccessToken(token) {
  accessToken = token
}

export function onSessionLost(listener) {
  sessionLostListeners.add(listener)
  return () => sessionLostListeners.delete(listener)
}

export class ApiError extends Error {
  constructor(status, detail, fields = {}) {
    super(typeof detail === 'string' ? detail : 'Request failed')
    this.status = status
    this.detail = detail
    this.fields = fields
  }
}

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch('/auth/refresh', { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          accessToken = null
          return null
        }
        const data = await res.json()
        accessToken = data.access_token
        return data
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function parse(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function request(method, path, { body, auth = true, retried = false } = {}) {
  const headers = {}
  if (body !== undefined && body !== null) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  let res
  try {
    res = await fetch(path, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'network')
  }


  if (res.status === 401 && auth && !retried) {
    const refreshed = await refreshSession()
    if (refreshed) return request(method, path, { body, auth, retried: true })
    sessionLostListeners.forEach((fn) => fn())
  }

  const data = await parse(res)
  if (!res.ok) {
    const detail = data?.detail ?? data?.error ?? null
    const fields = {}
    if (Array.isArray(detail)) {
      for (const item of detail) {
        const name = item.loc?.[item.loc.length - 1]
        if (name !== undefined) fields[name] = item.msg
      }
    }
    throw new ApiError(res.status, detail, fields)
  }
  return data
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { ...opts, body }),
  put: (path, body, opts) => request('PUT', path, { ...opts, body }),
  delete: (path, opts) => request('DELETE', path, opts),
}