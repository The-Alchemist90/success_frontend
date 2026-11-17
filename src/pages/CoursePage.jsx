import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, BookOpenText, Clock, Eye, EyeOff, GraduationCap, Layers, LogOut, PartyPopper, PlayCircle, Sparkles, UserRound } from 'lucide-react'
import { ConfirmDialog } from '../components/feed/Dialogs'
import { Cover, Meta, ProgressBar } from '../components/learn/CourseCard'
import { ModuleBlock } from '../components/learn/Outline'
import { ProgressRing } from '../components/formExtras'
import { Button } from '../components/ui'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'
import { coursesApi, duration, textOf } from '../lib/courses'
import { errorKey } from '../lib/feed'
import { usePrefs } from '../lib/prefs'
import { useToast } from '../lib/toast'

export default function CoursePage() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const { t, lang } = usePrefs()
  const { notify, toast } = useToast()
  const isAdmin = user.role === 'admin'
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState(null)
  const [phase, setPhase] = useState('loading')
  const [busy, setBusy] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [open, setOpen] = useState({})

  const load = useCallback(
    async (first = false) => {
      try {
        const detail = await coursesApi.get(courseId)
        const joined = detail.enrollment && detail.enrollment.status !== 'dropped'
        const prog = detail.enrollment ? await coursesApi.progress(courseId).catch(() => null) : null
        setCourse(detail)
        setProgress(prog)
        setPhase('ready')
        if (first) {
          const target = prog?.next_lesson_id
          const module = detail.modules.find((m) => m.lessons.some((l) => l.id === target)) || detail.modules[0]
          setOpen(module ? { [module.id]: true } : {})
        }
        return joined
      } catch {
        setPhase('gone')
        return false
      }
    },
    [courseId],
  )

  useEffect(() => {
    setPhase('loading')
    load(true)
  }, [load])

  const status = useMemo(() => Object.fromEntries((progress?.lessons || []).map((l) => [l.lesson_id, l.status])), [progress])

  async function run(action, success) {
    setBusy(true)
    try {
      await action()
      await load()
      if (success) notify(success)
    } catch (err) {
      notify(t(errorKey(err)), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function togglePublish() {
    setBusy(true)
    try {
      const updated = await coursesApi.setPublished(course.id, !course.is_published)
      setCourse((prev) => ({ ...prev, ...updated, enrollment: prev.enrollment }))
      notify(t(updated.is_published ? 'courses.publishedOk' : 'courses.unpublishedOk'))
    } catch (err) {
      notify(err instanceof ApiError && err.status === 409 ? t('courses.needLesson') : t(errorKey(err)), 'error')
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'loading') {
    return (
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8" role="status" aria-label={t('common.loading')}>
        <div className="skeleton h-56 rounded-3xl" />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="skeleton h-56 rounded-2xl" />
        </div>
      </div>
    )
  }
  if (phase === 'gone') {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col items-center gap-4 px-4 py-20 text-center">
        <AlertCircle className="size-10 text-on-surface-variant" aria-hidden="true" />
        <p className="text-body-md text-on-surface-variant">{t('courses.notFound')}</p>
        <Link to="/learn" className="inline-flex h-11 items-center rounded-xl bg-primary-container px-5 font-display text-label-lg text-white hover:bg-primary-hover">{t('courses.browse')}</Link>
      </div>
    )
  }

  const enrollment = course.enrollment
  const joined = enrollment && enrollment.status !== 'dropped'
  const dropped = enrollment?.status === 'dropped'
  const canRead = joined || isAdmin
  const title = textOf(course.title, lang)
  const description = textOf(course.description, lang)
  const percent = enrollment?.progress_percent ?? 0
  const firstLesson = course.modules.flatMap((m) => m.lessons)[0]
  const nextId = progress?.next_lesson_id || firstLesson?.id
  const finished = joined && course.lessons_count > 0 && progress && progress.completed_lessons === progress.total_lessons

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <Link to="/learn" className="inline-flex w-fit items-center gap-2 rounded-lg px-2 py-1.5 text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('courses.title')}
      </Link>

      <Cover code={course.code || ''} className="animate-fade-up rounded-3xl p-6 text-white shadow-[0_24px_48px_-22px_rgba(13,92,58,0.5)] sm:p-9">
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 font-display text-label-lg font-bold ring-1 ring-white/25 backdrop-blur">{course.code}</span>
            {course.level && <span className="rounded-full bg-white/15 px-3 py-1 font-display text-label-md backdrop-blur">{t(`register.levels.${course.level}`)}</span>}
            {course.semester && <span className="rounded-full bg-white/15 px-3 py-1 font-display text-label-md backdrop-blur">{t('courses.semester', { n: course.semester })}</span>}
            {course.credits ? <span className="rounded-full bg-white/15 px-3 py-1 font-display text-label-md backdrop-blur">{t(course.credits === 1 ? 'courses.creditOne' : 'courses.creditMany', { n: course.credits })}</span> : null}
            {!course.is_published && <span className="rounded-full bg-black/40 px-3 py-1 font-display text-label-md backdrop-blur">{t('courses.draft')}</span>}
          </div>
          <h1 className="max-w-3xl font-display text-headline-lg-mobile font-bold md:text-display-hero md:leading-tight">{title}</h1>
          {description && <p className="max-w-2xl text-body-lg text-white/85">{description}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-label-lg text-white/85">
            <span className="inline-flex items-center gap-1.5"><Layers className="size-4" aria-hidden="true" />{t(course.modules_count === 1 ? 'courses.moduleOne' : 'courses.moduleMany', { n: course.modules_count })}</span>
            <span className="inline-flex items-center gap-1.5"><BookOpenText className="size-4" aria-hidden="true" />{t(course.lessons_count === 1 ? 'courses.lessonOne' : 'courses.lessonMany', { n: course.lessons_count })}</span>
            {course.total_minutes > 0 && <span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden="true" />{duration(course.total_minutes, t)}</span>}
            {course.teachers?.length > 0 && <span className="inline-flex items-center gap-1.5"><UserRound className="size-4" aria-hidden="true" />{course.teachers.join(', ')}</span>}
          </div>
        </div>
      </Cover>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-lowest p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(13,92,58,0.22)]">
            {joined ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <ProgressRing percent={percent} />
                  <div>
                    <p className="font-display text-title-sm font-bold text-on-surface">{t('courses.progress')}</p>
                    <p className="text-body-sm text-on-surface-variant">{t('courses.lessonsDone', { done: progress?.completed_lessons ?? 0, total: progress?.total_lessons ?? course.lessons_count })}</p>
                  </div>
                </div>
                {finished && (
                  <p className="flex items-center gap-2 rounded-xl bg-primary-fixed px-3.5 py-2.5 text-body-sm text-on-primary-fixed">
                    <PartyPopper className="size-4 shrink-0" aria-hidden="true" />
                    {t('courses.allDone')}
                  </p>
                )}
                {nextId && (
                  <Link to={`/learn/lesson/${nextId}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-container px-5 font-display text-label-lg text-white shadow-sm transition-all hover:bg-primary-hover active:scale-[0.98]">
                    <PlayCircle className="size-5" aria-hidden="true" />
                    {finished ? t('courses.review') : percent > 0 ? t('courses.continue') : t('courses.start')}
                  </Link>
                )}
                <button type="button" onClick={() => setLeaving(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
                  <LogOut className="size-4" aria-hidden="true" />
                  {t('courses.leave')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed"><GraduationCap className="size-6" aria-hidden="true" /></span>
                  <div>
                    <p className="font-display text-title-sm font-bold text-on-surface">{dropped ? t('courses.leftTitle') : t('courses.freeTitle')}</p>
                    <p className="text-body-sm text-on-surface-variant">{dropped ? t('courses.leftText') : t('courses.freeText')}</p>
                  </div>
                </div>
                <Button onClick={() => run(() => coursesApi.enroll(course.id), t('courses.enrolledOk'))} loading={busy} disabled={!course.is_published} className="h-12 w-full text-title-sm">
                  {dropped ? t('courses.rejoin') : t('courses.enroll')}
                </Button>
                {!course.is_published && <p className="text-body-sm text-on-surface-variant">{t('courses.notOpen')}</p>}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="rounded-2xl border border-dashed border-secondary/50 bg-secondary-fixed/40 p-4">
              <p className="mb-3 flex items-center gap-2 font-display text-label-lg font-bold text-on-secondary-fixed"><Sparkles className="size-4" aria-hidden="true" />{t('courses.adminTitle')}</p>
              <p className="mb-3 text-body-sm text-on-secondary-fixed">{course.is_published ? t('courses.adminLive') : t('courses.adminDraft')}</p>
              <Button variant="outline" onClick={togglePublish} loading={busy} className="w-full bg-surface-lowest">
                {course.is_published ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                {course.is_published ? t('courses.unpublish') : t('courses.publish')}
              </Button>
            </div>
          )}
        </aside>

        <section className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-headline-sm text-on-surface">{t('courses.content')}</h2>
            {joined && <div className="w-40"><ProgressBar percent={percent} /></div>}
          </div>
          {!canRead && <p className="rounded-xl bg-tertiary-fixed px-4 py-3 text-body-sm text-on-tertiary-fixed">{t('courses.enrollToRead')}</p>}
          {course.modules.length === 0 && <p className="rounded-2xl border border-dashed border-outline-variant px-5 py-8 text-center text-body-md text-on-surface-variant">{t('courses.noLessons')}</p>}
          {course.modules.map((module) => (
            <ModuleBlock
              key={module.id}
              module={module}
              status={status}
              locked={!canRead}
              open={Boolean(open[module.id])}
              onToggle={() => setOpen((prev) => ({ ...prev, [module.id]: !prev[module.id] }))}
              showObjectives
            />
          ))}
        </section>
      </div>

      {leaving && (
        <ConfirmDialog
          title={t('courses.leaveTitle')}
          text={t('courses.leaveText')}
          confirmLabel={t('courses.leaveConfirm')}
          onConfirm={async () => {
            await run(() => coursesApi.leave(course.id), t('courses.leftOk'))
            setLeaving(false)
          }}
          onClose={() => setLeaving(false)}
        />
      )}
      {toast}
    </div>
  )
}