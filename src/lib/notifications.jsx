import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { railApi } from './rail'

const NotificationsContext = createContext(null)

/** Keeps the latest notifications. Refreshes every minute, only while the page is visible (saves data). */
export function NotificationsProvider({ children }) {
  const [state, setState] = useState({ items: [], unread: 0, loaded: false })

  const refresh = useCallback(async () => {
    try {
      const data = await railApi.notifications(8)
      setState({ items: data.items, unread: data.unread_count, loaded: true })
    } catch {
      /* keep what we have */
    }
  }, [])

  useEffect(() => {
    refresh()
    const tick = () => document.visibilityState === 'visible' && refresh()
    const timer = setInterval(tick, 60000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [refresh])

  const markRead = useCallback(async (id) => {
    setState((s) => {
      const target = s.items.find((n) => n.id === id)
      if (!target || target.is_read) return s
      return { ...s, unread: Math.max(0, s.unread - 1), items: s.items.map((n) => (n.id === id ? { ...n, is_read: true } : n)) }
    })
    try {
      await railApi.markRead(id)
    } catch {
      refresh()
    }
  }, [refresh])

  const markAll = useCallback(async () => {
    setState((s) => ({ ...s, unread: 0, items: s.items.map((n) => ({ ...n, is_read: true })) }))
    try {
      await railApi.markAllRead()
    } catch {
      refresh()
    }
  }, [refresh])

  const value = useMemo(() => ({ ...state, refresh, markRead, markAll }), [state, refresh, markRead, markAll])
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>')
  return ctx
}