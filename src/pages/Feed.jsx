import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, HelpCircle, FileText, Inbox, Link2, Loader2, RotateCw } from 'lucide-react'
import Composer from '../components/feed/Composer'
import PostCard, { PostSkeleton } from '../components/feed/PostCard'
import RightRail, { Glance } from '../components/feed/RightRail'
import StudentCard from '../components/StudentCard'
import { Button } from '../components/ui'
import { useAuth } from '../auth/AuthContext'
import { abbreviate } from '../lib/abbreviate'
import { errorKey, feedApi } from '../lib/feed'
import { usePrefs } from '../lib/prefs'
import { railApi } from '../lib/rail'
import { useToast } from '../lib/toast'

const TABS = ['all', 'question', 'summary', 'announcement']

function Hero({ user, waiting, onAction }) {
  const { t, lang } = usePrefs()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'hero.morning' : hour < 18 ? 'hero.afternoon' : 'hero.evening'
  const today = new Date().toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })
  const subtitle = waiting > 0 ? t(waiting === 1 ? 'hero.waitingOne' : 'hero.waitingMany', { n: waiting }) : t('hero.calm')
  const action =
    'inline-flex h-10 items-center gap-2 rounded-full bg-white/15 px-4 font-display text-label-lg text-white ring-1 ring-white/25 backdrop-blur transition-all hover:bg-white/25 active:scale-[0.98]'
  return (
    <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-[#002f1c] via-[#0d5c3a] to-[#15803d] p-6 text-white shadow-[0_24px_48px_-20px_rgba(13,92,58,0.55)] sm:p-8">
      <div aria-hidden="true" className="pattern-diamonds-light absolute inset-0" />
      <div aria-hidden="true" className="absolute -right-16 -top-24 size-72 rounded-full bg-[#ff9b5e]/30 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-28 left-1/4 size-72 rounded-full bg-[#a9f3c5]/20 blur-3xl" />
      <div className="relative">
        <p className="font-display text-label-lg capitalize text-white/70">{today}</p>
        <h1 className="mt-1 font-display text-headline-lg-mobile font-bold md:text-headline-lg">{t(greeting, { name: user.first_name })}</h1>
        <p className="mt-2 max-w-md text-body-md text-white/80">{subtitle}</p>
        <div className="no-scrollbar -mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1 [&>*]:shrink-0">
          <button type="button" className={action} onClick={() => onAction({ category: 'question' })}>
            <HelpCircle className="size-4" aria-hidden="true" />
            {t('hero.ask')}
          </button>
          <button type="button" className={action} onClick={() => onAction({ category: 'summary' })}>
            <FileText className="size-4" aria-hidden="true" />
            {t('hero.summary')}
          </button>
          <button type="button" className={action} onClick={() => onAction({ category: 'general', link: true })}>
            <Link2 className="size-4" aria-hidden="true" />
            {t('hero.link')}
          </button>
        </div>
      </div>
    </section>
  )
}

export default function Feed() {
  const { user } = useAuth()
  const { t } = usePrefs()
  const { notify, toast } = useToast()
  const [filters, setFilters] = useState({ category: null, campus: null })
  const [posts, setPosts] = useState([])
  const [cursor, setCursor] = useState(null)
  const [phase, setPhase] = useState('loading') // loading | ready | error
  const [loadingMore, setLoadingMore] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [campuses, setCampuses] = useState([])
  const [stats, setStats] = useState(null)
  const [questions, setQuestions] = useState([])
  const [compose, setCompose] = useState(null)

  const loadSide = useCallback(() => {
    railApi.stats().then(setStats).catch(() => {})
    railApi
      .questions()
      .then((page) => setQuestions(page.items.filter((q) => q.comments_count === 0 && q.author.id !== user.id).slice(0, 3)))
      .catch(() => {})
  }, [user.id])
  useEffect(() => {
    loadSide()
  }, [loadSide])

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
  const removePost = useCallback(
    (id) => {
      setPosts((prev) => prev.filter((p) => p.id !== id))
      loadSide()
    },
    [loadSide],
  )

  function onCreated(post) {
    const fitsCategory = !filters.category || filters.category === post.category
    const fitsCampus = !filters.campus || (user.university || '').toLowerCase() === filters.campus.toLowerCase()
    if (fitsCategory && fitsCampus) setPosts((prev) => [post, ...prev])
    else setFilters({ category: null, campus: null }) // show the new post: go back to "All"
    notify(t('feed.posted'))
    loadSide()
  }

  const openComposer = (request = {}) => setCompose({ ...request, nonce: Date.now() })
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
    <div className="mx-auto grid max-w-[1120px] gap-8 px-4 py-6 sm:px-6 lg:py-8 xl:grid-cols-[minmax(0,640px)_320px] xl:justify-center">
      <div className="flex min-w-0 flex-col gap-5">
        <Hero user={user} waiting={questions.length} onAction={openComposer} />
        <Glance stats={stats} questions={questions} />
        <Composer onCreated={onCreated} request={compose} />

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
        <div className="no-scrollbar sticky top-24 flex max-h-[calc(100dvh-7rem)] flex-col gap-5 overflow-y-auto pb-4 [&>*]:shrink-0">
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
          <RightRail stats={stats} questions={questions} onCompose={() => openComposer({ category: 'general' })} />
        </div>
      </aside>
      {toast}
    </div>
  )
}