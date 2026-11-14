import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, onSessionLost, refreshSession, setAccessToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'authenticated' | 'anonymous'

  // On every page load: try to restore the session from the refresh cookie.
  useEffect(() => {
    let alive = true
    refreshSession().then((data) => {
      if (!alive) return
      if (data) {
        setUser(data.user)
        setStatus('authenticated')
      } else {
        setStatus('anonymous')
      }
    })
    return () => {
      alive = false
    }
  }, [])

  // If the server revokes the session later (logout everywhere, password change...).
  useEffect(
    () =>
      onSessionLost(() => {
        setAccessToken(null)
        setUser(null)
        setStatus('anonymous')
      }),
    [],
  )

  const login = useCallback(async ({ identifier, password, remember }) => {
    const data = await api.post(
      '/auth/login',
      { identifier: identifier.trim(), password, public_computer: !remember },
      { auth: false },
    )
    setAccessToken(data.access_token)
    setUser(data.user)
    setStatus('authenticated')
    return data.user
  }, [])

  const register = useCallback(
    async (payload) => {
      await api.post('/auth/register', payload, { auth: false })
      return login({ identifier: payload.email, password: payload.password, remember: true })
    },
    [login],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', null, { auth: false })
    } catch {
      /* even if the server is unreachable, we forget the session here */
    }
    setAccessToken(null)
    setUser(null)
    setStatus('anonymous')
  }, [])

  const reloadUser = useCallback(async () => {
    const fresh = await api.get('/users/me')
    setUser(fresh)
    return fresh
  }, [])

  const updateUser = useCallback((fresh) => setUser(fresh), [])

  const value = useMemo(
    () => ({ user, status, login, register, logout, reloadUser, updateUser }),
    [user, status, login, register, logout, reloadUser, updateUser],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}