import { useEffect, useState } from 'react'
import { AlertCircle, GraduationCap, Loader2, RotateCw, Search, X } from 'lucide-react'
import CourseCard, { ContinueCard, CourseSkeleton } from '../components/learn/CourseCard'
import { Button } from '../components/ui'
import { useAuth } from '../auth/AuthContext'
import { coursesApi } from '../lib/courses'
import { usePrefs } from '../lib/prefs'

const LEVELS = [1, 2, 3, 4, 5, 6]
const PAGE = 12

export default function Courses() {
  const { user } = useAuth()
  const { t } = usePrefs()
  const isAdmin = user.role === 'admin'
  const [tab, setTab] = useState('all') // all | mine
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [level, setLevel] = useState(null)
  const [status, setStatus] = useState('published') // admins only
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [phase, setPhase] = useState('loading')
  const [more, setMore] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [resume, setResume] = useState([])

  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let alive = true
    coursesApi
      .mine({ limit: 6 })
      .then((page) => alive && setResume(page.items))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    setPhase('loading')
    const request = tab === 'mine' ? coursesApi.mine({ limit: 50 }) : coursesApi.list({ q, level, status: isAdmin ? status : undefined, limit: PAGE })
    request
      .then((page) => {
        if (!alive) return
        let list = page.items
        if (tab === 'mine') {
          const needle = q.toLowerCase()
          list = list.filter((c) => (!level || c.level === level) && (!needle || `${c.code} ${JSON.stringify(c.title)}`.toLowerCase().includes(needle)))
        }
        setItems(list)
        setTotal(tab === 'mine' ? list.length : page.total)
        setPhase('ready')
      })
      .catch(() => alive && setPhase('error'))
    return () => {
      alive = false
    }
  }, [tab, q, level, status, isAdmin, reloadKey])

  async function loadMore() {
    setMore(true)
    try {
      const page = await coursesApi.list({ q, level, status: isAdmin ? status : undefined, limit: PAGE, offset: items.length })
      setItems((prev) => {
        const seen = new Set(prev.map((c) => c.id))
        return [...prev, ...page.items.filter((c) => !seen.has(c.id))]
      })
    } finally {
      setMore(false)
    }
  }

  const pill = (active) =>
    `h-10 shrink-0 rounded-full px-4 font-display text-label-lg transition-all ${
      active ? 'bg-on-surface text-surface shadow-sm' : 'bg-surface-lowest text-on-surface-variant ring-1 ring-outline-variant/70 hover:text-on-surface hover:ring-outline'
    }`
  const chip = (active) =>
    `h-8 shrink-0 rounded-full border px-3 font-display text-label-md transition-colors ${
      active ? 'border-primary-container bg-primary-fixed text-on-primary-fixed' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
    }`
  const filtered = Boolean(q || level)

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-7 px-4 py-6 sm:px-6 lg:py-8">
      <header className="animate-fade-up flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 font-display text-label-md text-on-primary-fixed">
          <GraduationCap className="size-4" aria-hidden="true" />
          {t('courses.badge')}
        </span>
        <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">{t('courses.exploreTitle')}</h1>
        <p className="max-w-2xl text-body-md text-on-surface-variant">{t('courses.subtitle')}</p>
      </header>

      {resume.length > 0 && (
        <section aria-label={t('courses.continueTitle')} className="flex flex-col gap-3">
          <h2 className="text-title-md text-on-surface">{t('courses.continueTitle')}</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {resume.slice(0, 2).map((course) => (
              <ContinueCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
            {['all', 'mine'].map((key) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={pill(tab === key)}>
                {t(`courses.tabs.${key}`)}
              </button>
            ))}
          </div>
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('courses.search')}
              aria-label={t('courses.search')}
              className="h-11 w-full rounded-xl border border-transparent bg-surface-lowest pl-10 pr-9 text-body-md text-on-surface outline-none ring-1 ring-outline-variant/70 placeholder:text-outline focus:ring-2 focus:ring-primary-container/60"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label={t('common.close')} className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container">
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label={t('courses.levelAll')}>
          <button type="button" onClick={() => setLevel(null)} aria-pressed={!level} className={chip(!level)}>
            {t('courses.levelAll')}
          </button>
          {LEVELS.map((n) => (
            <button key={n} type="button" onClick={() => setLevel(level === n ? null : n)} aria-pressed={level === n} className={chip(level === n)} title={t(`register.levels.${n}`)}>
              {t(`register.levelShort.${n}`)}
            </button>
          ))}
          {isAdmin && tab === 'all' && (
            <div className="ml-auto flex shrink-0 gap-1 rounded-full bg-surface-container p-0.5" role="group" aria-label="status">
              {['published', 'draft', 'all'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  aria-pressed={status === key}
                  className={`rounded-full px-3 py-1 font-display text-label-md ${status === key ? 'bg-primary-container text-white' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  {t(`courses.status.${key}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        {phase === 'loading' && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label={t('common.loading')}>
            {[0, 1, 2].map((i) => (
              <CourseSkeleton key={i} />
            ))}
          </div>
        )}

        {phase === 'error' && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline-variant px-6 py-12 text-center">
            <AlertCircle className="size-9 text-error" aria-hidden="true" />
            <p className="text-body-md text-on-surface-variant">{t('courses.loadError')}</p>
            <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
              <RotateCw className="size-4" aria-hidden="true" />
              {t('feed.retry')}
            </Button>
          </div>
        )}

        {phase === 'ready' && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline-variant px-6 py-14 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed">
              <GraduationCap className="size-7" aria-hidden="true" />
            </span>
            <h2 className="text-title-md text-on-surface">{filtered ? t('courses.emptyFilteredTitle') : tab === 'mine' ? t('courses.emptyMineTitle') : t('courses.emptyTitle')}</h2>
            <p className="max-w-sm text-body-md text-on-surface-variant">
              {filtered ? t('courses.emptyFiltered') : tab === 'mine' ? t('courses.emptyMine') : isAdmin ? t('courses.emptyAdmin') : t('courses.emptyText')}
            </p>
            {filtered && (
              <Button variant="outline" onClick={() => { setSearch(''); setLevel(null) }}>
                {t('feed.clearFilters')}
              </Button>
            )}
            {!filtered && tab === 'mine' && (
              <Button onClick={() => setTab('all')}>{t('courses.browse')}</Button>
            )}
          </div>
        )}

        {phase === 'ready' && items.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((course) => (
                <div key={course.id} className="animate-fade-up flex">
                  <div className="flex w-full flex-col [&>a]:flex-1">
                    <CourseCard course={course} />
                  </div>
                </div>
              ))}
            </div>
            {tab === 'all' && items.length < total && (
              <Button variant="outline" onClick={loadMore} loading={more} className="self-center">
                {more ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {t('courses.loadMore')}
              </Button>
            )}
          </>
        )}
      </section>
    </div>
  )
}