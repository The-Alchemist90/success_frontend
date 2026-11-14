import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import fr from '../locales/fr'
import en from '../locales/en'
import { ApiError } from './api'

const dictionaries = { fr, en }
const PrefsContext = createContext(null)

function readStorage(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode: ignore */
  }
}

function initialLang() {
  const saved = readStorage('lang')
  if (saved === 'fr' || saved === 'en') return saved
  return 'en'
}

function initialTheme() {
  const saved = readStorage('theme')
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function lookup(dict, path) {
  return path.split('.').reduce((obj, key) => (obj == null ? undefined : obj[key]), dict)
}

export function PrefsProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setLang = useCallback((value) => {
    setLangState(value)
    writeStorage('lang', value)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      writeStorage('theme', next)
      return next
    })
  }, [])

  /** t('login.title') or t('home.welcome', { name: 'Jean' }) */
  const t = useCallback(
    (key, vars) => {
      let value = lookup(dictionaries[lang], key) ?? lookup(dictionaries.fr, key) ?? key
      if (typeof value === 'string' && vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          value = value.replaceAll(`{${name}}`, String(replacement))
        }
      }
      return value
    },
    [lang],
  )

  /** Turns any API error into a sentence in the current language. */
  const describeError = useCallback(
    (err) => {
      if (!(err instanceof ApiError)) return t('errors.generic')
      if (err.status === 0) return t('errors.network')
      if (err.status === 429) return t('errors.tooMany')
      if (err.status === 401) {
        const isLogin = typeof err.detail === 'string' && err.detail.startsWith('Invalid credentials')
        return t(isLogin ? 'errors.invalidCredentials' : 'errors.session')
      }
      if (err.status === 409) return t('errors.exists')
      if (err.status === 400 && typeof err.detail === 'string' && err.detail.includes('code')) {
        return t('errors.badCode')
      }
      if (err.status === 422) return t('errors.invalidData')
      return t('errors.generic')
    },
    [t],
  )

  const value = useMemo(
    () => ({ lang, setLang, theme, toggleTheme, t, describeError }),
    [lang, setLang, theme, toggleTheme, t, describeError],
  )
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}

export function usePrefs() {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs must be used inside <PrefsProvider>')
  return ctx
}