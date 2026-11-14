import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Avatar from './Avatar'
import { LangToggle, Logo, ThemeToggle } from './ui'
import { useAuth } from '../auth/AuthContext'
import { usePrefs } from '../lib/prefs'

function Header({ children }) {
  return (
    <header className="sticky top-0 z-40 bg-surface/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-3 px-4 md:px-6 lg:px-10">
        <Link to="/" aria-label="Success">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          {children}
        </div>
      </div>
    </header>
  )
}
/** Slim top bar used by the full-screen pages (login, register). */
export function TopBar({ className = '', logoClass = '' }) {
  return (
    <header className={`flex h-16 shrink-0 items-center justify-between gap-3 px-4 md:px-8 ${className}`}>
      <Link to="/" aria-label="Success" className={logoClass}>
        <Logo />
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <LangToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}

/** Page frame for visitors (login, register). */
export function PublicShell({ children }) {
  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main>{children}</main>
    </div>
  )
}

/** Page frame for logged-in students. */
export function AppShell({ children }) {
  const { user, logout } = useAuth()
  const { t } = usePrefs()
  return (
    <div className="min-h-screen bg-surface">
      <Header>
        <Avatar user={user} size="sm" className="ml-1" />
        <span className="hidden max-w-40 truncate text-label-lg text-on-surface-variant sm:inline">
          {user?.first_name}
        </span>
        <button
          type="button"
          onClick={logout}
          className="flex h-9 items-center gap-2 rounded-xl px-3 text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t('common.logout')}</span>
        </button>
      </Header>
      <main>{children}</main>
    </div>
  )
}