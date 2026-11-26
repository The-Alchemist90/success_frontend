import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Check, CheckCheck, ChevronRight, HeartHandshake, MessageCircle, PenSquare, ThumbsUp } from 'lucide-react'
import Avatar from '../Avatar'
import { NotificationItem, notificationPath } from '../notifications/NotificationBell'
import { ProgressRing } from '../formExtras'
import { useAuth } from '../../auth/AuthContext'
import { useNotifications } from '../../lib/notifications'
import { usePrefs } from '../../lib/prefs'
import { railApi } from '../../lib/rail'

const cardClass = 'rounded-2xl border border-outline-variant/60 bg-surface-lowest p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-16px_rgba(13,92,58,0.18)]'

/** The student's real progress: only things he can actually do today. */
export function profileSteps(user, stats, firstHelpId) {
  return [
    { key: 'photo', done: Boolean(user.profile_pic_cloudinary_id), to: '/profile' },
    { key: 'email', done: Boolean(user.email_verified), to: '/verify-email' },
    { key: 'post', done: (stats?.posts ?? 0) > 0, action: 'compose' },
    { key: 'answer', done: (stats?.answers ?? 0) > 0, to: firstHelpId ? `/post/${firstHelpId}` : null },
  ]
}
export const percentOf = (steps) => Math.round((steps.filter((s) => s.done).length / steps.length) * 100)

function Heading({ children, right }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="text-title-sm text-on-surface">{children}</h2>
      {right}
    </div>
  )
}

function Courses() {
  const { t, lang } = usePrefs()
  const [items, setItems] = useState(null)
  useEffect(() => {
    let alive = true
    railApi
      .courses()
      .then((page) => alive && setItems(page.items))
      .catch(() => alive && setItems([]))
    return () => {
      alive = false
    }
  }, [])
  if (items === null) return <div className="skeleton mt-4 h-12 rounded-xl" aria-hidden="true" />
  return (
    <div className="mt-5 border-t border-outline-variant/50 pt-4">
      <p className="mb-3 flex items-center gap-2 text-label-lg text-on-surface">
        <BookOpen className="size-4 text-primary" aria-hidden="true" />
        {t('rail.courses')}
      </p>
      {items.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">{t('rail.noCourses')}</p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {items.map((c) => {
            const pct = c.enrollment?.progress_percent ?? 0
            return (
                <li key={c.id}>
                <Link to={c.next_lesson_id ? `/learn/lesson/${c.next_lesson_id}` : `/learn/${c.id}`} className="-mx-2 block rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-container">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-body-sm font-medium text-on-surface">{c.title[lang] || c.title.fr || c.title.en}</span>
                    <span className="shrink-0 text-label-md tabular-nums text-on-surface-variant">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-high" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-linear-to-r from-primary-container to-[#22c55e] transition-[width] duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ProgressCard({ steps, onCompose }) {
  const { t } = usePrefs()
  const percent = percentOf(steps)
  return (
    <section className={cardClass}>
      <Heading>{t('rail.progress')}</Heading>
      <div className="flex items-center gap-4">
        <ProgressRing percent={percent} />
        <p className="text-body-sm text-on-surface-variant">{percent === 100 ? t('rail.allDone') : t('rail.progressHint')}</p>
      </div>
      <ul className="mt-4 flex flex-col gap-1.5">
        {steps.map((s) => {
          const body = (
            <>
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${s.done ? 'bg-primary-container text-white' : 'bg-surface-high text-outline'}`}>
                <Check className="size-3" aria-hidden="true" />
              </span>
              <span className={`flex-1 text-left text-body-sm ${s.done ? 'text-on-surface-variant line-through decoration-outline/50' : 'text-on-surface'}`}>{t(`rail.step.${s.key}`)}</span>
              {!s.done && (s.to || s.action) && <ChevronRight className="size-4 text-outline" aria-hidden="true" />}
            </>
          )
          const row = 'flex items-center gap-2.5 rounded-lg px-2 py-1.5'
          if (s.done || (!s.to && !s.action)) return <li key={s.key} className={row}>{body}</li>
          return (
            <li key={s.key}>
              {s.to ? (
                <Link to={s.to} className={`${row} transition-colors hover:bg-surface-container`}>{body}</Link>
              ) : (
                <button type="button" onClick={onCompose} className={`${row} w-full transition-colors hover:bg-surface-container`}>{body}</button>
              )}
            </li>
          )
        })}
      </ul>
      <Courses />
    </section>
  )
}

function Tile({ Icon, value, label, tone }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl bg-surface-low p-3">
      <span className={`flex size-8 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="font-display text-headline-sm font-bold tabular-nums text-on-surface">{value ?? '–'}</span>
      <span className="text-label-md leading-tight text-on-surface-variant">{label}</span>
    </div>
  )
}

function ActivityCard({ stats }) {
  const { t } = usePrefs()
  return (
    <section className={cardClass}>
      <Heading>{t('rail.activity')}</Heading>
      <div className="grid grid-cols-3 gap-2.5">
        <Tile Icon={PenSquare} value={stats?.posts} label={t('rail.statPosts')} tone="bg-primary-fixed text-on-primary-fixed" />
        <Tile Icon={ThumbsUp} value={stats?.helpful} label={t('rail.statHelpful')} tone="bg-secondary-fixed text-on-secondary-fixed" />
        <Tile Icon={MessageCircle} value={stats?.answers} label={t('rail.statAnswers')} tone="bg-tertiary-fixed text-on-tertiary-fixed" />
      </div>
    </section>
  )
}

function NotificationsCard() {
  const { t } = usePrefs()
  const navigate = useNavigate()
  const { items, unread, loaded, markRead, markAll } = useNotifications()
  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-title-sm text-on-surface">
          {t('rail.recent')}
          {unread > 0 && <span className="rounded-full bg-secondary px-2 py-0.5 text-label-sm font-bold text-white">{unread}</span>}
        </h2>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAll}
            title={t('notif.markAll')}
            aria-label={t('notif.markAll')}
            className="flex size-8 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary-fixed"
          >
            <CheckCheck className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {!loaded ? (
        <div className="skeleton h-16 rounded-xl" aria-hidden="true" />
      ) : items.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">{t('rail.recentEmpty')}</p>
      ) : (
        <div className="-mx-1.5 flex flex-col gap-0.5">
          {items.slice(0, 3).map((n) => (
            <NotificationItem
              key={n.id}
              n={n}
              onOpen={(item) => {
                markRead(item.id)
                const path = notificationPath(item)
                if (path) navigate(path)
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function HelpCard({ questions }) {
  const { t } = usePrefs()
  return (
    <section className={cardClass}>
      <Heading>
        <span className="inline-flex items-center gap-2">
          <HeartHandshake className="size-4 text-secondary" aria-hidden="true" />
          {t('rail.help')}
        </span>
      </Heading>
      {questions.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">{t('rail.helpEmpty')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {questions.map((q) => (
            <li key={q.id}>
              <Link to={`/post/${q.id}`} className="group flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-surface-container">
                <Avatar user={q.author} size="sm" />
                <span className="min-w-0 flex-1">
                  {q.subject && <span className="mb-0.5 block truncate text-label-md font-bold text-secondary">{q.subject}</span>}
                  <span className="line-clamp-2 text-body-sm text-on-surface">{q.content}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-label-md text-primary">
                    {t('rail.answerIt')}
                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function RightRail({ stats, questions, onCompose }) {
  const { user } = useAuth()
  const steps = profileSteps(user, stats, questions[0]?.id)
  return (
    <div className="flex flex-col gap-5">
      <ProgressCard steps={steps} onCompose={onCompose} />
      <ActivityCard stats={stats} />
      <NotificationsCard />
      <HelpCard questions={questions} />
    </div>
  )
}

/** Compact version for screens without a right column. */
export function Glance({ stats, questions }) {
  const { user } = useAuth()
  const { t } = usePrefs()
  const steps = profileSteps(user, stats, questions[0]?.id)
  const cell = 'flex flex-1 flex-col items-center gap-0.5 px-2'
  return (
    <section className={`${cardClass} flex items-center gap-4 !p-4 xl:hidden`}>
      <ProgressRing percent={percentOf(steps)} />
      <div className="flex flex-1 divide-x divide-outline-variant/60 text-center">
        {[
          [stats?.posts, t('rail.statPosts')],
          [stats?.helpful, t('rail.statHelpful')],
          [stats?.answers, t('rail.statAnswers')],
        ].map(([value, label]) => (
          <div key={label} className={cell}>
            <span className="font-display text-title-md font-bold tabular-nums text-on-surface">{value ?? '–'}</span>
            <span className="text-label-md leading-tight text-on-surface-variant">{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}