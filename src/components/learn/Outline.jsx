import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronDown, Circle, CircleDot, Headphones, Lock, PlayCircle } from 'lucide-react'
import { textOf } from '../../lib/courses'
import { usePrefs } from '../../lib/prefs'

export function StatusIcon({ status, locked }) {
  if (locked) return <Lock className="size-4 shrink-0 text-outline" aria-hidden="true" />
  if (status === 'completed') return <CheckCircle2 className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
  if (status === 'in_progress') return <CircleDot className="size-[18px] shrink-0 text-secondary" aria-hidden="true" />
  return <Circle className="size-[18px] shrink-0 text-outline-variant" aria-hidden="true" />
}

/** One lesson line. A link when the student may read it, plain text otherwise. */
export function LessonRow({ lesson, moduleOrder, status, locked, current, onNavigate }) {
  const { t, lang } = usePrefs()
  const body = (
    <>
      <StatusIcon status={status} locked={locked} />
      <span className="w-9 shrink-0 font-mono text-label-md text-on-surface-variant">{`${moduleOrder}.${lesson.order}`}</span>
      <span className={`min-w-0 flex-1 text-body-sm ${current ? 'font-bold text-on-primary-fixed' : 'text-on-surface'}`}>{textOf(lesson.title, lang)}</span>
      {lesson.has_video && <PlayCircle className="size-4 shrink-0 text-secondary" aria-label={t('courses.video')} />}
      {lesson.has_audio && <Headphones className="size-4 shrink-0 text-primary" aria-label={t('courses.audio')} />}
      {lesson.duration_minutes ? <span className="shrink-0 text-label-md tabular-nums text-on-surface-variant">{t('courses.min', { n: lesson.duration_minutes })}</span> : null}
    </>
  )
  const base = 'flex items-center gap-2.5 rounded-lg px-2.5 py-2'
  if (locked) return <li className={`${base} cursor-not-allowed opacity-70`} title={t('courses.enrollToRead')}>{body}</li>
  return (
    <li>
      <Link to={`/learn/lesson/${lesson.id}`} onClick={onNavigate} aria-current={current ? 'page' : undefined} className={`${base} transition-colors ${current ? 'bg-primary-fixed' : 'hover:bg-surface-container'}`}>
        {body}
      </Link>
    </li>
  )
}

export function ModuleBlock({ module, status, locked, currentId, open, onToggle, onNavigate, showObjectives }) {
  const { t, lang } = usePrefs()
  const lessons = module.lessons
  const done = lessons.filter((l) => status[l.id] === 'completed').length
  const objectives = module.objectives?.[lang] || module.objectives?.en || module.objectives?.fr || []
  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-lowest">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-low">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl font-display text-label-lg font-bold ${done === lessons.length && lessons.length > 0 ? 'bg-primary-container text-white' : 'bg-primary-fixed text-on-primary-fixed'}`}>{module.order}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-title-sm font-bold text-on-surface">{textOf(module.title, lang)}</span>
          <span className="block text-label-md text-on-surface-variant">
            {t(lessons.length === 1 ? 'courses.lessonOne' : 'courses.lessonMany', { n: lessons.length })}
            {!locked && lessons.length > 0 && <span className="ml-2 text-primary">{t('courses.moduleDone', { done, total: lessons.length })}</span>}
          </span>
        </span>
        <ChevronDown className={`size-5 shrink-0 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="border-t border-outline-variant/50 px-2 pb-2 pt-1">
          {showObjectives && objectives.length > 0 && (
            <ul className="mx-2 mb-2 mt-2 flex flex-wrap gap-1.5">
              {objectives.map((o) => (
                <li key={o} className="rounded-full bg-surface-container px-2.5 py-1 text-label-md text-on-surface-variant">{o}</li>
              ))}
            </ul>
          )}
          <ul className="flex flex-col gap-0.5">
            {lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} moduleOrder={module.order} status={status[lesson.id]} locked={locked} current={lesson.id === currentId} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}