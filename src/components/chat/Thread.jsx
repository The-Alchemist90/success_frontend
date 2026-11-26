import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Check, CheckCheck, Loader2, Lock, Send } from 'lucide-react'
import Avatar from '../Avatar'
import { LinkText } from '../feed/Links'
import { ApiError } from '../../lib/api'
import { abbreviate } from '../../lib/abbreviate'
import { netApi, netErrorKey } from '../../lib/net'
import { useNetwork } from '../../lib/network'
import { usePrefs } from '../../lib/prefs'

const MAX = 2000

function DayLabel({ iso }) {
  const { t, lang } = usePrefs()
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const label =
    date.toDateString() === today.toDateString()
      ? t('chat.today')
      : date.toDateString() === yesterday.toDateString()
        ? t('chat.yesterday')
        : date.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="my-3 flex justify-center">
      <span className="rounded-full bg-surface-container px-3 py-1 text-label-md capitalize text-on-surface-variant">{label}</span>
    </div>
  )
}

function Bubble({ message }) {
  const { lang } = usePrefs()
  const time = new Date(message.sent_at).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
  const mine = message.mine
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[84%] rounded-2xl px-3.5 py-2 shadow-sm sm:max-w-[72%] ${
          mine ? 'rounded-br-md bg-primary-fixed text-on-primary-fixed' : 'rounded-bl-md bg-surface-lowest text-on-surface ring-1 ring-outline-variant/60'
        } ${message.pending ? 'opacity-70' : ''}`}
      >
        <p className="whitespace-pre-wrap break-words text-body-md">
          <LinkText text={message.content || ''} />
        </p>
        <p className="mt-0.5 flex items-center justify-end gap-1 text-label-sm opacity-70">
          {time}
          {mine && (message.pending ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : message.read_at ? <CheckCheck className="size-3.5 text-primary" aria-label="seen" /> : <Check className="size-3.5" aria-hidden="true" />)}
        </p>
      </div>
    </div>
  )
}

export default function Thread({ userId, peer, onActivity }) {
  const { t } = usePrefs()
  const { refresh } = useNetwork()
  const [phase, setPhase] = useState('loading') // loading | ready | error | forbidden
  const [items, setItems] = useState([])
  const [older, setOlder] = useState(null)
  const [olderBusy, setOlderBusy] = useState(false)
  const [text, setText] = useState('')
  const [problem, setProblem] = useState('')
  const scroller = useRef(null)
  const latest = useRef(null)
  const stick = useRef(true)
  const counter = useRef(0)
  const ticks = useRef(0)
  const itemsRef = useRef([])
  itemsRef.current = items

  const toBottom = () => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }
  const markRead = () =>
    netApi
      .markRead(userId)
      .then(() => {
        refresh()
        onActivity()
      })
      .catch(() => {})

  // open a conversation
  useEffect(() => {
    let alive = true
    setPhase('loading')
    setItems([])
    setOlder(null)
    setText('')
    setProblem('')
    latest.current = null
    stick.current = true
    netApi
      .messages(userId)
      .then((page) => {
        if (!alive) return
        setItems(page.items)
        setOlder(page.next_cursor)
        latest.current = page.latest_cursor
        setPhase('ready')
        markRead()
      })
      .catch((err) => alive && setPhase(err instanceof ApiError && err.status === 403 ? 'forbidden' : 'error'))
    return () => {
      alive = false
    }
  }, [userId])

  useLayoutEffect(() => {
    if (phase === 'ready' && stick.current) toBottom()
  }, [items, phase])

  // live updates: ask only for NEWER messages (tiny answers: light on data)
  useEffect(() => {
    if (phase !== 'ready') return undefined
    let alive = true
    const tick = async () => {
      if (document.visibilityState !== 'visible') return
      ticks.current += 1
      try {
        const page = await netApi.messages(userId, { after: latest.current || undefined, limit: 60 })
        if (!alive) return
        if (page.items.length) {
          if (page.latest_cursor) latest.current = page.latest_cursor
          setItems((prev) => {
            const seen = new Set(prev.map((m) => m.id))
            const fresh = page.items.filter((m) => !seen.has(m.id))
            return fresh.length ? [...prev, ...fresh] : prev
          })
          if (page.items.some((m) => !m.mine)) markRead()
        }
        // every ~24 s, only if some of my messages are still unseen, refresh the "seen" marks
        if (ticks.current % 6 === 0 && itemsRef.current.some((m) => m.mine && !m.read_at && !m.pending)) {
          const last = await netApi.messages(userId, { limit: 30 })
          if (!alive) return
          const marks = new Map(last.items.map((m) => [m.id, m.read_at]))
          setItems((prev) => prev.map((m) => (marks.get(m.id) && !m.read_at ? { ...m, read_at: marks.get(m.id) } : m)))
        }
      } catch {
        /* next tick will retry */
      }
    }
    const timer = setInterval(tick, 4000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [phase, userId])

  async function send() {
    const content = text.trim()
    if (!content || content.length > MAX) return
    const temp = { id: `tmp-${++counter.current}`, mine: true, content, sent_at: new Date().toISOString(), read_at: null, pending: true }
    stick.current = true
    setProblem('')
    setItems((prev) => [...prev, temp])
    setText('')
    try {
      const saved = await netApi.send(userId, content)
      setItems((prev) => (prev.some((m) => m.id === saved.id) ? prev.filter((m) => m.id !== temp.id) : prev.map((m) => (m.id === temp.id ? saved : m))))
      onActivity()
    } catch (err) {
      setItems((prev) => prev.filter((m) => m.id !== temp.id))
      setText(content)
      setProblem(t(netErrorKey(err)))
    }
  }

  async function loadOlder() {
    const el = scroller.current
    const before = el.scrollHeight
    setOlderBusy(true)
    stick.current = false
    try {
      const page = await netApi.messages(userId, { before: older })
      setItems((prev) => [...page.items, ...prev])
      setOlder(page.next_cursor)
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - before
      })
    } catch (err) {
      setProblem(t(netErrorKey(err)))
    } finally {
      setOlderBusy(false)
    }
  }

  const place = peer ? [abbreviate(peer.university), abbreviate(peer.faculty)].filter(Boolean).join(', ') : ''
  let lastDay = ''
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface-low/60">
      <header className="flex items-center gap-3 border-b border-outline-variant/60 bg-surface-lowest px-3 py-3 sm:px-5">
        <Link to="/messages" aria-label={t('chat.back')} className="flex size-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container lg:hidden">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        {peer ? (
          <>
            <Avatar user={peer} size="md" />
            <div className="min-w-0">
              <p className="truncate font-display text-title-sm font-bold text-on-surface">
                {peer.first_name} {peer.last_name}
              </p>
              <p className="truncate text-label-md text-on-surface-variant">
                {[peer.academic_level ? t('card.level', { n: peer.academic_level }) : '', place].filter(Boolean).join(', ')}
              </p>
            </div>
          </>
        ) : (
          <div className="skeleton h-10 w-48 rounded-xl" aria-hidden="true" />
        )}
      </header>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90
        }}
        className="scroll-thin flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4 sm:px-5"
      >
        {phase === 'loading' && (
          <div className="flex flex-1 items-center justify-center text-on-surface-variant" role="status">
            <Loader2 className="size-6 animate-spin" aria-label={t('common.loading')} />
          </div>
        )}
        {phase === 'forbidden' && (
          <div className="m-auto flex max-w-xs flex-col items-center gap-3 text-center">
            <Lock className="size-9 text-on-surface-variant" aria-hidden="true" />
            <p className="text-body-md text-on-surface-variant">{t('chat.notFriends')}</p>
            <Link to="/friends" className="inline-flex h-10 items-center rounded-xl bg-primary-container px-4 font-display text-label-lg text-white hover:bg-primary-hover">{t('chat.goFriends')}</Link>
          </div>
        )}
        {phase === 'error' && (
          <div className="m-auto flex flex-col items-center gap-2 text-center text-on-surface-variant">
            <AlertCircle className="size-8 text-error" aria-hidden="true" />
            <p className="text-body-md">{t('chat.loadError')}</p>
          </div>
        )}
        {phase === 'ready' && (
          <>
            {older && (
              <button type="button" onClick={loadOlder} disabled={olderBusy} className="mx-auto mb-2 inline-flex h-9 items-center gap-2 rounded-full bg-surface-lowest px-4 font-display text-label-md text-primary ring-1 ring-outline-variant/70 hover:bg-primary-fixed disabled:opacity-60">
                {olderBusy && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
                {t('chat.older')}
              </button>
            )}
            {items.length === 0 && <p className="m-auto rounded-2xl bg-surface-lowest px-5 py-3 text-body-md text-on-surface-variant ring-1 ring-outline-variant/60">{t('chat.noMessages')}</p>}
            {items.map((message) => {
              const day = new Date(message.sent_at).toDateString()
              const separator = day !== lastDay
              lastDay = day
              return (
                <Fragment key={message.id}>
                  {separator && <DayLabel iso={message.sent_at} />}
                  <Bubble message={message} />
                </Fragment>
              )
            })}
          </>
        )}
      </div>

      {phase === 'ready' && (
        <div className="border-t border-outline-variant/60 bg-surface-lowest p-3 sm:px-5">
          {problem && (
            <p role="alert" className="mb-2 rounded-lg bg-error-container px-3 py-2 text-body-sm text-on-error-container">
              {problem}
            </p>
          )}
          <div className="flex items-end gap-2">
            <div className="flex min-w-0 flex-1 items-end rounded-2xl bg-surface-low px-4 py-1.5 focus-within:bg-surface-lowest focus-within:ring-2 focus-within:ring-primary-container/40">
              <textarea
                value={text}
                rows={1}
                maxLength={MAX + 100}
                placeholder={t('chat.placeholder')}
                aria-label={t('chat.placeholder')}
                onChange={(e) => setText(e.target.value)}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                className="max-h-36 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-body-md text-on-surface outline-none placeholder:text-outline"
              />
              {text.trim().length > MAX - 300 && <span className={`mb-2 ml-2 text-label-sm tabular-nums ${text.trim().length > MAX ? 'font-bold text-error' : 'text-on-surface-variant'}`}>{text.trim().length}/{MAX}</span>}
            </div>
            <button
              type="button"
              onClick={send}
              disabled={!text.trim() || text.trim().length > MAX}
              aria-label={t('chat.send')}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-white shadow-sm transition-all hover:bg-primary-hover active:scale-95 disabled:bg-surface-high disabled:text-outline disabled:shadow-none"
            >
              <Send className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}