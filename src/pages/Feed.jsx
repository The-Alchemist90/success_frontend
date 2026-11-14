import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Inbox, Loader2, RotateCw } from 'lucide-react'
import Composer from '../components/feed/Composer'
import PostCard, { PostSkeleton } from '../components/feed/PostCard'
import StudentCard from '../components/StudentCard'
import { Button } from '../components/ui'
import { useAuth } from '../auth/AuthContext'
import { abbreviate } from '../lib/abbreviate'
import { errorKey, feedApi } from '../lib/feed'
import { usePrefs } from '../lib/prefs'

const TABS = ['all', 'question', 'summary', 'announcement']

export default function Feed() {
  const { user } = useAuth()
  const { t } = usePrefs()
  const [filters, setFilters] = useState({ category: null, campus: null })
  const [posts, setPosts] = useState([])
  const [cursor, setCursor] = useState(null)
  const [phase, setPhase] = useState('loading') // loading | ready | error
  const [loadingMore, setLoadingMore] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [campuses, setCampuses] = useState([])
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const notify = useCallback((message, kind = 'success') => {
    setToast({ message, kind })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3800)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  useEffect(() => {
    let alive = true
    feedApi
      .campuses()
      .then((list) => alive && setCampuses(list))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    setPhase('loading')
    feedApi
      .list(filters)
      .then((page) => {
        if (!alive) return
        setPosts(page.items)
        setCursor(page.next_cursor)
        setPhase('ready')
      })
      .catch(() => alive && setPhase('error'))
    return () => {
      alive = false
    }
  }, [filters, reloadKey])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const page = await feedApi.list({ ...filters, cursor })
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id))
        return [...prev, ...page.items.filter((p) => !seen.has(p.id))]
      })
      setCursor(page.next_cursor)
    } catch (err) {
      notify(t(errorKey(err)), 'error')
    } finally {
      setLoadingMore(false)
    }
  }

  const patchPost = useCallback((id, change) => setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...change } : p))), [])
  const removePost = useCallback((id) => setPosts((prev) => prev.filter((p) => p.id !== id)), [])

  function onCreated(post) {
    const fitsCategory = !filters.category || filters.category === post.category
    const fitsCampus = !filters.campus || (user.university || '').toLowerCase() === filters.campus.toLowerCase()
    if (fitsCategory && fitsCampus) setPosts((prev) => [post, ...prev])
    else setFilters({ category: null, campus: null }) // show the new post: go back to "All"
    notify(t('feed.posted'))
  }

  const filtered = filters.category || filters.campus
  const tabClass = (active) =>
    `h-10 shrink-0 rounded-full px-4 font-display text-label-lg transition-all ${
      active ? 'bg-on-surface text-surface shadow-sm' : 'bg-surface-lowest text-on-surface-variant ring-1 ring-outline-variant/70 hover:text-on-surface hover:ring-outline'
    }`
  const chipClass = (active) =>
    `h-8 shrink-0 rounded-full border px-3 font-display text-label-md transition-colors ${
      active ? 'border-primary-container bg-primary-fixed text-on-primary-fixed' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
    }`

  return (
    <div className="mx-auto grid max-w-[1080px] gap-8 px-4 py-6 sm:px-6 lg:py-8 xl:grid-cols-[minmax(0,640px)_300px] xl:justify-center">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="animate-fade-up">
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">{t('feed.title')}</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">{t('feed.subtitle')}</p>
        </div>

        <Composer onCreated={onCreated} />

        <div className="flex flex-col gap-3">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label={t('feed.title')}>
            {TABS.map((tab) => {
              const active = (filters.category ?? 'all') === tab
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilters((f) => ({ ...f, category: tab === 'all' ? null : tab }))}
                  className={tabClass(active)}
                >
                  {t(`feed.tabs.${tab}`)}
                </button>
              )
            })}
          </div>
          {campuses.length > 1 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label={t('feed.campuses')} role="group">
              <button type="button" onClick={() => setFilters((f) => ({ ...f, campus: null }))} aria-pressed={!filters.campus} className={chipClass(!filters.campus)}>
                {t('feed.campusAll')}
              </button>
              {campuses.map((c) => (
                <button
                  key={c.university}
                  type="button"
                  title={c.university}
                  aria-pressed={filters.campus === c.university}
                  onClick={() => setFilters((f) => ({ ...f, campus: f.campus === c.university ? null : c.university }))}
                  className={chipClass(filters.campus === c.university)}
                >
                  {abbreviate(c.university)}
                </button>
              ))}
            </div>
          )}
        </div>

        {phase === 'loading' && (
          <div className="flex flex-col gap-5" role="status" aria-label={t('common.loading')}>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        )}

        {phase === 'error' && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline-variant px-6 py-12 text-center">
            <AlertCircle className="size-9 text-error" aria-hidden="true" />
            <p className="text-body-md text-on-surface-variant">{t('feed.loadError')}</p>
            <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
              <RotateCw className="size-4" aria-hidden="true" />
              {t('feed.retry')}
            </Button>
          </div>
        )}

        {phase === 'ready' && posts.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline-variant px-6 py-14 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed">
              <Inbox className="size-7" aria-hidden="true" />
            </span>
            <h2 className="text-title-md text-on-surface">{t('feed.emptyTitle')}</h2>
            <p className="max-w-xs text-body-md text-on-surface-variant">{filtered ? t('feed.emptyFiltered') : t('feed.emptyText')}</p>
            {filtered && (
              <Button variant="outline" onClick={() => setFilters({ category: null, campus: null })}>
                {t('feed.clearFilters')}
              </Button>
            )}
          </div>
        )}

        {phase === 'ready' && posts.length > 0 && (
          <div className="flex flex-col gap-5">
            {posts.map((post) => (
              <div key={post.id} className="animate-fade-up">
                <PostCard post={post} me={user} onPatch={patchPost} onDeleted={removePost} notify={notify} />
              </div>
            ))}
            {cursor && (
              <Button variant="outline" onClick={loadMore} loading={loadingMore} className="self-center">
                {loadingMore ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {t('feed.loadMore')}
              </Button>
            )}
          </div>
        )}
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-24 flex flex-col gap-5">
          <div>
            <h2 className="mb-3 text-title-sm text-on-surface-variant">{t('feed.yourCard')}</h2>
            <StudentCard
              firstName={user.first_name}
              lastName={user.last_name}
              university={user.university || ''}
              faculty={user.faculty || ''}
              level={user.academic_level}
              specialty={user.specialty || ''}
              photoUrl={user.profile_pic_url}
              matricule={user.matricule}
              matriculeIsFinal
            />
          </div>
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-lowest p-5">
            <h2 className="text-title-sm text-on-surface">{t('feed.rulesTitle')}</h2>
            <ul className="mt-3 flex flex-col gap-2.5 text-body-sm text-on-surface-variant">
              {['rule1', 'rule2', 'rule3'].map((key) => (
                <li key={key} className="flex gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
                  {t(`feed.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-[70] max-w-[90vw] -translate-x-1/2 rounded-full px-5 py-3 text-label-lg shadow-2xl ${
            toast.kind === 'error' ? 'bg-error text-white' : 'bg-on-surface text-surface'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}