import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ArrowRight, BookOpenText, CheckCircle2, Eye, Headphones, Languages, ListOrdered, Lock, PartyPopper, PlayCircle, RotateCcw } from 'lucide-react'
import { Modal } from '../components/feed/Dialogs'
import { ProgressBar } from '../components/learn/CourseCard'
import Markdown from '../components/learn/Markdown'
import { ModuleBlock } from '../components/learn/Outline'
import { Button } from '../components/ui'
import { ApiError } from '../lib/api'
import { audioUrl, coursesApi, duration, mediaReady, pick, textOf, videoPoster, videoUrl } from '../lib/courses'
import { errorKey } from '../lib/feed'
import { usePrefs } from '../lib/prefs'
import { useToast } from '../lib/toast'

function OutlinePanel({ course, status, currentId, canRead, onNavigate }) {
  const { t, lang } = usePrefs()
  const currentModule = course.modules.find((m) => m.lessons.some((l) => l.id === currentId))
  const [open, setOpen] = useState({ [currentModule?.id]: true })
  const percent = course.enrollment?.progress_percent ?? 0
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-outline-variant/60 bg-surface-lowest p-4">
        <Link to={`/learn/${course.id}`} onClick={onNavigate} className="font-display text-label-md font-bold text-secondary hover:underline">{course.code}</Link>
        <p className="font-display text-title-sm font-bold text-on-surface">{textOf(course.title, lang)}</p>
        {canRead && course.enrollment && (
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar percent={percent} className="flex-1" />
            <span className="text-label-md tabular-nums text-on-surface-variant">{percent}%</span>
          </div>
        )}
      </div>
      {course.modules.map((module) => (
        <ModuleBlock
          key={module.id}
          module={module}
          status={status}
          locked={!canRead}
          currentId={currentId}
          open={Boolean(open[module.id])}
          onToggle={() => setOpen((prev) => ({ ...prev, [module.id]: !prev[module.id] }))}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

export default function LessonPage() {
  const { lessonId } = useParams()
  const { t, lang } = usePrefs()
  const { notify, toast } = useToast()
  const [lesson, setLesson] = useState(null)
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState(null)
  const [phase, setPhase] = useState('loading') // loading | ready | forbidden | gone
  const [tab, setTab] = useState('notes')
  const [busy, setBusy] = useState(false)
  const [outlineOpen, setOutlineOpen] = useState(false)
  const lastSaved = useRef(0)

  useEffect(() => {
    let alive = true
    setPhase('loading')
    setTab('notes')
    window.scrollTo(0, 0)
    coursesApi
      .lesson(lessonId)
      .then(async (data) => {
        const [detail, prog] = await Promise.all([coursesApi.get(data.course_id), coursesApi.progress(data.course_id).catch(() => null)])
        if (!alive) return
        setLesson(data)
        setCourse(detail)
        setProgress(prog)
        setPhase('ready')
      })
      .catch((err) => alive && setPhase(err instanceof ApiError && err.status === 403 ? 'forbidden' : 'gone'))
    return () => {
      alive = false
    }
  }, [lessonId])

  const status = useMemo(() => Object.fromEntries((progress?.lessons || []).map((l) => [l.lesson_id, l.status])), [progress])
  const flat = useMemo(() => (course ? course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m }))) : []), [course])

  if (phase === 'loading') {
    return (
      <div className="mx-auto flex max-w-[860px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8" role="status" aria-label={t('common.loading')}>
        <div className="skeleton h-8 w-48 rounded-full" />
        <div className="skeleton h-12 w-3/4 rounded-xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    )
  }
  if (phase !== 'ready') {
    const forbidden = phase === 'forbidden'
    return (
      <div className="mx-auto flex max-w-[560px] flex-col items-center gap-4 px-4 py-20 text-center">
        {forbidden ? <Lock className="size-10 text-on-surface-variant" aria-hidden="true" /> : <AlertCircle className="size-10 text-on-surface-variant" aria-hidden="true" />}
        <p className="text-body-md text-on-surface-variant">{forbidden ? t('courses.enrollToRead') : t('courses.lessonGone')}</p>
        <Link to="/learn" className="inline-flex h-11 items-center rounded-xl bg-primary-container px-5 font-display text-label-lg text-white hover:bg-primary-hover">{t('courses.browse')}</Link>
      </div>
    )
  }

  const index = flat.findIndex((l) => l.id === lessonId)
  const previous = flat[index - 1]
  const next = flat[index + 1]
  const module = flat[index]?.module || course.modules.find((m) => m.id === lesson.module_id)
  const enrolled = course.enrollment && course.enrollment.status !== 'dropped'
  const completed = status[lessonId] === 'completed'
  const finished = progress && progress.total_lessons > 0 && progress.completed_lessons === progress.total_lessons

  const title = pick(lesson.title, lang).text
  const summary = pick(lesson.summary, lang).text
  const content = pick(lesson.content, lang)
  const videoId = lang === 'fr' ? lesson.video_fr || lesson.video_en : lesson.video_en || lesson.video_fr
  const hasVideo = Boolean(videoId)
  const hasAudio = Boolean(lesson.audio)
  const tabs = [
    { key: 'notes', Icon: BookOpenText, show: true },
    { key: 'video', Icon: PlayCircle, show: hasVideo },
    { key: 'audio', Icon: Headphones, show: hasAudio },
  ].filter((x) => x.show)
  const savedPosition = progress?.lessons?.find((l) => l.lesson_id === lessonId)?.last_position_seconds || 0

  function savePosition(element) {
    if (!enrolled || completed) return // never turn a finished lesson back into "in progress"
    const seconds = Math.floor(element.currentTime)
    if (seconds < 5) return
    lastSaved.current = Date.now()
    coursesApi.saveProgress(lessonId, { status: 'in_progress', last_position_seconds: seconds }).catch(() => {})
  }

  async function setDone(done) {
    setBusy(true)
    try {
      const result = await coursesApi.saveProgress(lessonId, { status: done ? 'completed' : 'in_progress', last_position_seconds: 0 })
      setCourse((c) => ({ ...c, enrollment: { ...c.enrollment, progress_percent: result.course_progress_percent } }))
      setProgress(await coursesApi.progress(course.id))
      notify(done ? t('courses.lessonDone') : t('courses.lessonUndone'))
    } catch (err) {
      notify(t(errorKey(err)), 'error')
    } finally {
      setBusy(false)
    }
  }

  const navButton = 'inline-flex h-11 items-center gap-2 rounded-xl px-4 font-display text-label-lg transition-colors'
  return (
    <div className="mx-auto grid max-w-[1120px] gap-8 px-4 py-6 sm:px-6 lg:py-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <article className="flex min-w-0 flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link to={`/learn/${course.id}`} className="inline-flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{course.code} · {textOf(course.title, lang)}</span>
          </Link>
          <button type="button" onClick={() => setOutlineOpen(true)} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-surface-lowest px-3.5 font-display text-label-lg text-on-surface ring-1 ring-outline-variant/70 hover:bg-surface-container xl:hidden">
            <ListOrdered className="size-4" aria-hidden="true" />
            {t('courses.outline')}
          </button>
        </div>

        <header className="animate-fade-up flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-fixed px-3 py-1 font-display text-label-md font-bold text-on-primary-fixed">
              {t('courses.moduleLesson', { m: module?.order ?? '', l: flat[index]?.order ?? '' })}
            </span>
            {lesson.duration_minutes ? <span className="rounded-full bg-surface-container px-3 py-1 font-display text-label-md text-on-surface-variant">{duration(lesson.duration_minutes, t)}</span> : null}
            {completed && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-1 font-display text-label-md text-white">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                {t('courses.completed')}
              </span>
            )}
          </div>
          <h1 className="font-display text-headline-lg-mobile font-bold text-on-surface md:text-headline-lg">{title}</h1>
          {summary && (
            <p className="rounded-2xl border-l-4 border-secondary bg-secondary-fixed/50 px-5 py-3.5 text-body-md text-on-secondary-fixed">
              <span className="mb-0.5 block font-display text-label-md font-bold">{t('courses.inShort')}</span>
              {summary}
            </p>
          )}
        </header>

        {tabs.length > 1 && (
          <div className="flex gap-2" role="tablist">
            {tabs.map(({ key, Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`inline-flex h-10 items-center gap-2 rounded-full px-4 font-display text-label-lg transition-all ${
                  tab === key ? 'bg-on-surface text-surface shadow-sm' : 'bg-surface-lowest text-on-surface-variant ring-1 ring-outline-variant/70 hover:text-on-surface'
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {t(`courses.${key}`)}
              </button>
            ))}
          </div>
        )}

        <div className="rounded-3xl border border-outline-variant/60 bg-surface-lowest p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-20px_rgba(13,92,58,0.2)] sm:p-9">
          {tab === 'notes' && (
            <>
              {content.text && content.lang !== lang && (
                <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-tertiary-fixed px-3.5 py-1.5 text-label-md text-on-tertiary-fixed">
                  <Languages className="size-4" aria-hidden="true" />
                  {t('courses.onlyIn', { lang: t(`courses.langName.${content.lang}`) })}
                </p>
              )}
              {content.text ? <Markdown>{content.text}</Markdown> : <p className="text-body-md text-on-surface-variant">{t('courses.noNotes')}</p>}
            </>
          )}
          {tab === 'video' && hasVideo && (
            <div className="flex flex-col gap-3">
              {mediaReady ? (
                <video
                  key={videoId}
                  controls
                  playsInline
                  preload="none"
                  poster={videoPoster(videoId)}
                  className="aspect-video w-full rounded-2xl bg-black"
                  onLoadedMetadata={(e) => {
                    if (savedPosition > 5 && !completed) e.currentTarget.currentTime = savedPosition
                  }}
                  onTimeUpdate={(e) => Date.now() - lastSaved.current > 20000 && savePosition(e.currentTarget)}
                  onPause={(e) => savePosition(e.currentTarget)}
                  onEnded={(e) => savePosition(e.currentTarget)}
                >
                  <source src={videoUrl(videoId)} />
                </video>
              ) : (
                <p className="rounded-xl bg-tertiary-fixed px-4 py-3 text-body-sm text-on-tertiary-fixed">{t('courses.mediaOff')}</p>
              )}
              <p className="text-body-sm text-on-surface-variant">{t('courses.videoHint')}</p>
            </div>
          )}
          {tab === 'audio' && hasAudio && (
            <div className="flex flex-col gap-3">
              {mediaReady ? <audio key={lesson.audio} controls preload="none" src={audioUrl(lesson.audio)} className="w-full" /> : <p className="rounded-xl bg-tertiary-fixed px-4 py-3 text-body-sm text-on-tertiary-fixed">{t('courses.mediaOff')}</p>}
              <p className="text-body-sm text-on-surface-variant">{t('courses.audioHint')}</p>
            </div>
          )}
        </div>

        {finished && completed && (
          <p className="flex items-center gap-3 rounded-2xl bg-primary-fixed px-5 py-4 font-display text-title-sm text-on-primary-fixed">
            <PartyPopper className="size-6 shrink-0" aria-hidden="true" />
            {t('courses.allDone')}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/50 pt-5">
          {previous ? (
            <Link to={`/learn/lesson/${previous.id}`} className={`${navButton} text-on-surface-variant hover:bg-surface-container hover:text-on-surface`}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t('courses.previous')}
            </Link>
          ) : (
            <span />
          )}

          {enrolled ? (
            completed ? (
              <Button variant="ghost" onClick={() => setDone(false)} loading={busy}>
                <RotateCcw className="size-4" aria-hidden="true" />
                {t('courses.undo')}
              </Button>
            ) : (
              <Button onClick={() => setDone(true)} loading={busy} className="h-12 px-6 text-title-sm shadow-md">
                <CheckCircle2 className="size-5" aria-hidden="true" />
                {t('courses.markDone')}
              </Button>
            )
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary-fixed px-3.5 py-2 text-label-md text-on-secondary-fixed">
              <Eye className="size-4" aria-hidden="true" />
              {t('courses.previewMode')}
            </span>
          )}

          {next ? (
            <Link to={`/learn/lesson/${next.id}`} className={`${navButton} ${completed ? 'bg-primary-container text-white shadow-sm hover:bg-primary-hover' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
              {t('courses.next')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <Link to={`/learn/${course.id}`} className={`${navButton} ${completed ? 'bg-primary-container text-white shadow-sm hover:bg-primary-hover' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}>
              {t('courses.backToCourse')}
            </Link>
          )}
        </div>
      </article>

      <aside className="hidden xl:block">
        <div className="scroll-thin sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-1">
          <OutlinePanel course={course} status={status} currentId={lessonId} canRead onNavigate={() => {}} />
        </div>
      </aside>

      {outlineOpen && (
        <Modal title={t('courses.outline')} onClose={() => setOutlineOpen(false)}>
          <div className="mt-4">
            <OutlinePanel course={course} status={status} currentId={lessonId} canRead onNavigate={() => setOutlineOpen(false)} />
          </div>
        </Modal>
      )}
      {toast}
    </div>
  )
}