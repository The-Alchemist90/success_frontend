import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { netApi } from './net'

const NetworkContext = createContext(null)
const EMPTY = { friends: 0, incoming_requests: 0, unread_messages: 0 }

/** Numbers for the menu badges (friend requests, unread messages). Refreshed every 45 s while the page is visible. */
export function NetworkProvider({ children }) {
  const [summary, setSummary] = useState(EMPTY)

  const refresh = useCallback(async () => {
    try {
      setSummary(await netApi.summary())
    } catch {
      /* keep the last numbers */
    }
  }, [])

  useEffect(() => {
    refresh()
    const tick = () => document.visibilityState === 'visible' && refresh()
    const timer = setInterval(tick, 45000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [refresh])

  const value = useMemo(() => ({ summary, refresh }), [summary, refresh])
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork must be used inside <NetworkProvider>')
  return ctx
}