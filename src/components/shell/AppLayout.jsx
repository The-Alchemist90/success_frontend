import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, BookOpen, Compass, FolderOpen, LogOut, Menu, Newspaper, UserRound, Users, UsersRound, X } from 'lucide-react'
import Avatar from '../Avatar'
import NotificationBell from '../notifications/NotificationBell'
import { LangToggle, Logo, ThemeToggle } from '../ui'
import { useAuth } from '../../auth/AuthContext'
import { NotificationsProvider } from '../../lib/notifications'
import { usePrefs } from '../../lib/prefs'

const NAV = [
  { key: 'news', to: '/', Icon: Newspaper, end: true },
  { key: 'courses', to: '/learn', Icon: BookOpen },
  { key: 'mentoring', Icon: Compass },
  { key: 'friends', Icon: Users },
  { key: 'circles', Icon: UsersRound },
  { key: 'resources', Icon: FolderOpen },
  { key: 'notifications', Icon: Bell },
  { key: 'profile', to: '/profile', Icon: UserRound },
]

function NavList({ onNavigate }) {
  const { t } = usePrefs()
  const base = 'flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-display text-label-lg transition-all'
  return (
    <nav className="flex flex-col gap-1" aria-label={t('nav.menu')}>
      {NAV.map(({ key, to, Icon, end }) =>
        to ? (
          <NavLink
            key={key}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `${base} ${isActive ? 'bg-primary-container text-white shadow-md shadow-primary-container/25' : 'text-on-surface-variant hover:bg-surface-high hover:text-on-surface'}`
            }
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            {t(`nav.${key}`)}
          </NavLink>
        ) : (
          <span key={key} aria-disabled="true" className={`${base} cursor-not-allowed text-on-surface-variant/60`}>
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            {t(`nav.${key}`)}
            <span className="ml-auto rounded-full bg-surface-container px-2 py-0.5 text-label-sm font-semibold text-on-surface-variant">{t('nav.soon')}</span>
          </span>
        ),
      )}
    </nav>
  )
}

function SideUser() {
  const { user, logout } = useAuth()
  const { t } = usePrefs()
  return (
    <div className="rounded-2xl bg-surface-lowest p-3 ring-1 ring-outline-variant/60">
      <div className="flex items-center gap-3">
        <Avatar user={user} size="md" />
        <div className="min-w-0">
          <p className="truncate font-display text-title-sm font-bold text-on-surface">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="truncate font-mono text-label-md text-on-surface-variant">{user?.matricule}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
      >
        <LogOut className="size-4" aria-hidden="true" />
        {t('common.logout')}
      </button>
    </div>
  )
}

function Frame() {
  const { user } = useAuth()
  const { t } = usePrefs()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-outline-variant/50 bg-surface/85 px-4 backdrop-blur-xl lg:px-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('nav.menu')}
          className="flex size-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container lg:hidden"
        >
          <Menu className="size-6" aria-hidden="true" />
        </button>
        <Logo />
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <LangToggle />
          </div>
          <NotificationBell />
          <ThemeToggle />
          <Avatar user={user} size="sm" className="ml-1 hidden sm:flex" />
        </div>
      </header>

      <aside className="scroll-thin fixed bottom-0 left-0 top-16 z-30 hidden w-72 flex-col justify-between gap-6 overflow-y-auto border-r border-outline-variant/50 bg-surface-low p-4 lg:flex">
        <NavList />
        <SideUser />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t('nav.menu')}>
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-[19rem] max-w-[85vw] flex-col justify-between gap-6 overflow-y-auto bg-surface-low p-4 shadow-2xl">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="sm:hidden">
                  <LangToggle />
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t('common.close')}
                  className="ml-auto flex size-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <NavList onNavigate={() => setOpen(false)} />
            </div>
            <SideUser />
          </div>
        </div>
      )}

      <main className="relative isolate lg:pl-72">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] overflow-hidden">
          <div className="pattern-diamonds-dark absolute inset-0 opacity-50" />
          <div className="absolute -right-24 -top-36 size-[30rem] rounded-full bg-primary-fixed/60 blur-3xl" />
          <div className="absolute left-1/3 top-16 size-72 rounded-full bg-secondary-fixed/40 blur-3xl" />
        </div>
        <Outlet />
      </main>
    </div>
  )
}

export default function AppLayout() {
  return (
    <NotificationsProvider>
      <Frame />
    </NotificationsProvider>
  )
}