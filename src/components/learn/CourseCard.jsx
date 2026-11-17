import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenText, Clock, Layers, PlayCircle } from 'lucide-react'
import { coverFor, duration, textOf } from '../../lib/courses'
import { usePrefs } from '../../lib/prefs'

export function Cover({ code, className = '', children }) {
  return (
    <div className={`relative overflow-hidden bg-linear-to-br ${coverFor(code)} ${className}`}>
      <div aria-hidden="true" className="pattern-diamonds-light absolute inset-0" />
      <div aria-hidden="true" className="absolute -right-10 -top-12 size-40 rounded-full bg-white/15 blur-2xl" />
      {children}
    </div>
  )
}

export function Meta({ Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-label-md text-on-surface-variant">
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </span>
  )
}

export function ProgressBar({ percent, className = '' }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-surface-high ${className}`} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-linear-to-r from-primary-container to-[#22c55e] transition-[width] duration-700" style={{ width: `${percent}%` }} />
    </div>
  )
}

export default function CourseCard({ course }) {
  const { t, lang } = usePrefs()
  const title = textOf(course.title, lang)
  const description = textOf(course.description, lang)
  const enrollment = course.enrollment && course.enrollment.status !== 'dropped' ? course.enrollment : null
  const lessons = course.lessons_count
  return (
    <Link
      to={`/learn/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-lowest shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-14px_rgba(13,92,58,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(15,23,42,0.05),0_22px_44px_-16px_rgba(13,92,58,0.3)]"
    >
      <Cover code={course.code || ''} className="flex h-32 flex-col justify-between p-4 text-white">
        <div className="relative flex items-start justify-between gap-2">
          {course.level ? <span className="rounded-full bg-white/20 px-2.5 py-1 font-display text-label-md ring-1 ring-white/25 backdrop-blur">{t(`register.levelShort.${course.level}`)}</span> : <span />}
          {!course.is_published && <span className="rounded-full bg-black/40 px-2.5 py-1 font-display text-label-md backdrop-blur">{t('courses.draft')}</span>}
        </div>
        <p className="relative font-display text-headline-md font-bold tracking-tight drop-shadow-sm">{course.code}</p>
      </Cover>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="line-clamp-2 font-display text-title-md text-on-surface transition-colors group-hover:text-primary">{title}</h3>
          {description && <p className="mt-1.5 line-clamp-2 text-body-sm text-on-surface-variant">{description}</p>}
        </div>

        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5">
          <Meta Icon={Layers}>{t(course.modules_count === 1 ? 'courses.moduleOne' : 'courses.moduleMany', { n: course.modules_count })}</Meta>
          <Meta Icon={BookOpenText}>{t(lessons === 1 ? 'courses.lessonOne' : 'courses.lessonMany', { n: lessons })}</Meta>
          {course.total_minutes > 0 && <Meta Icon={Clock}>{duration(course.total_minutes, t)}</Meta>}
        </div>

        <div className="border-t border-outline-variant/50 pt-3.5">
          {enrollment ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-label-md">
                <span className="font-display text-primary">{t('courses.enrolled')}</span>
                <span className="tabular-nums text-on-surface-variant">{enrollment.progress_percent}%</span>
              </div>
              <ProgressBar percent={enrollment.progress_percent} />
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-display text-label-lg text-primary">
              {t('courses.viewCourse')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function CourseSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-lowest" aria-hidden="true">
      <div className="skeleton h-32" />
      <div className="flex flex-col gap-3 p-5">
        <div className="skeleton h-5 w-4/5 rounded-full" />
        <div className="skeleton h-3.5 w-full rounded-full" />
        <div className="skeleton h-3.5 w-2/3 rounded-full" />
        <div className="skeleton mt-3 h-8 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function ContinueCard({ course }) {
  const { t, lang } = usePrefs()
  const target = course.next_lesson_id ? `/learn/lesson/${course.next_lesson_id}` : `/learn/${course.id}`
  const pct = course.enrollment?.progress_percent ?? 0
  return (
    <Link
      to={target}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-lowest p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-16px_rgba(13,92,58,0.2)] transition-all hover:-translate-y-0.5 hover:border-primary-container/50"
    >
      <Cover code={course.code || ''} className="flex size-16 shrink-0 items-center justify-center rounded-xl text-white">
        <PlayCircle className="relative size-8 transition-transform group-hover:scale-110" aria-hidden="true" />
      </Cover>
      <div className="min-w-0 flex-1">
        <p className="font-display text-label-md font-bold text-secondary">{course.code}</p>
        <p className="truncate font-display text-title-sm font-bold text-on-surface">{textOf(course.title, lang)}</p>
        <div className="mt-2 flex items-center gap-3">
          <ProgressBar percent={pct} className="flex-1" />
          <span className="text-label-md tabular-nums text-on-surface-variant">{pct}%</span>
        </div>
      </div>
      <span className="hidden rounded-full bg-primary-container px-3.5 py-1.5 font-display text-label-md text-white transition-colors group-hover:bg-primary-hover sm:inline-block">
        {pct > 0 ? t('courses.continue') : t('courses.start')}
      </span>
    </Link>
  )
}