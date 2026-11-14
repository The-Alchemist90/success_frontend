import { useEffect, useState } from 'react'
import { Flag, Loader2, Send, ThumbsUp, Trash2 } from 'lucide-react'
import Avatar from '../Avatar'
import { ReportDialog } from './Dialogs'
import { errorKey, feedApi } from '../../lib/feed'
import { usePrefs } from '../../lib/prefs'
import { timeAgo } from '../../lib/time'
import { abbreviate } from '../../lib/abbreviate'

function CommentRow({ comment, me, onPatch, onRemoved, notify }) {
  const { t, lang } = usePrefs()
  const [armed, setArmed] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [busy, setBusy] = useState(false)
  const author = comment.author
  const mine = author.id === me.id

  async function toggleLike() {
    if (busy) return
    setBusy(true)
    const next = !comment.liked_by_me
    onPatch(comment.id, { liked_by_me: next, likes_count: Math.max(0, comment.likes_count + (next ? 1 : -1)) })
    try {
      const r = await feedApi.likeComment(comment.id, next)
      onPatch(comment.id, { liked_by_me: r.liked, likes_count: r.likes_count })
    } catch (err) {
      onPatch(comment.id, { liked_by_me: !next, likes_count: comment.likes_count })
      notify(t(errorKey(err)), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!armed) {
      setArmed(true)
      setTimeout(() => setArmed(false), 3500)
      return
    }
    try {
      await feedApi.removeComment(comment.id)
      onRemoved(comment.id)
    } catch (err) {
      notify(t(errorKey(err)), 'error')
    }
  }

  const action =
    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface'
  return (
    <li className="flex gap-3">
      <Avatar user={author} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md bg-surface-low px-4 py-2.5">
          <p className="flex flex-wrap items-center gap-x-2 text-label-lg text-on-surface">
            {author.first_name} {author.last_name}
            {author.academic_level && (
              <span className="rounded-full bg-surface-container px-2 py-px text-label-sm font-semibold text-on-surface-variant">
                {t('card.level', { n: author.academic_level })}
              </span>
            )}
            {author.specialty && (
              <span className="text-label-md font-normal text-on-surface-variant">{abbreviate(author.specialty, { maxLetters: 4 })}</span>
            )}
          </p>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-body-md text-on-surface">{comment.content}</p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1 pl-2">
          <span className="mr-1 text-label-md text-outline">{timeAgo(comment.created_at, lang)}</span>
          <button type="button" onClick={toggleLike} aria-pressed={comment.liked_by_me} className={`${action} ${comment.liked_by_me ? 'text-primary' : ''}`}>
            <ThumbsUp className={`size-3.5 ${comment.liked_by_me ? 'fill-current' : ''}`} aria-hidden="true" />
            {t('feed.helpful')}
            {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
          </button>
          {comment.can_delete && (
            <button type="button" onClick={remove} className={`${action} ${armed ? 'bg-error-container text-on-error-container' : ''}`}>
              <Trash2 className="size-3.5" aria-hidden="true" />
              {armed ? t('feed.sure') : t('feed.delete')}
            </button>
          )}
          {!mine && (
            <button type="button" onClick={() => setReporting(true)} className={action} aria-label={t('feed.report.title')}>
              <Flag className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {reporting && <ReportDialog targetType="comment" targetId={comment.id} onClose={() => setReporting(false)} notify={notify} />}
    </li>
  )
}

export default function Comments({ post, me, onCountChange, notify }) {
  const { t } = usePrefs()
  const isQuestion = post.category === 'question'
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [phase, setPhase] = useState('loading')
  const [moreBusy, setMoreBusy] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let alive = true
    feedApi
      .comments(post.id)
      .then((page) => {
        if (!alive) return
        setItems(page.items)
        setCursor(page.next_cursor)
        setPhase('ready')
      })
      .catch(() => alive && setPhase('error'))
    return () => {
      alive = false
    }
  }, [post.id])

  const patch = (id, change) => setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...change } : c)))

  async function loadMore() {
    setMoreBusy(true)
    try {
      const page = await feedApi.comments(post.id, cursor)
      setItems((prev) => {
        const seen = new Set(prev.map((c) => c.id))
        return [...prev, ...page.items.filter((c) => !seen.has(c.id))]
      })
      setCursor(page.next_cursor)
    } catch (err) {
      notify(t(errorKey(err)), 'error')
    } finally {
      setMoreBusy(false)
    }
  }

  async function send() {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    try {
      const created = await feedApi.addComment(post.id, content)
      setItems((prev) => [...prev, created])
      setText('')
      onCountChange(1)
    } catch (err) {
      notify(t(errorKey(err)), 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-outline-variant/50 pt-4">
      {phase === 'loading' && (
        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t('common.loading')}
        </div>
      )}
      {phase === 'error' && <p className="text-body-sm text-error">{t('feed.commentsError')}</p>}
      {phase === 'ready' && items.length === 0 && (
        <p className="text-body-sm text-on-surface-variant">{isQuestion ? t('feed.noAnswers') : t('feed.noComments')}</p>
      )}
      {items.length > 0 && (
        <ul className="flex flex-col gap-4">
          {items.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              me={me}
              onPatch={patch}
              onRemoved={(id) => {
                setItems((prev) => prev.filter((c) => c.id !== id))
                onCountChange(-1)
              }}
              notify={notify}
            />
          ))}
        </ul>
      )}
      {cursor && (
        <button type="button" onClick={loadMore} disabled={moreBusy} className="w-fit rounded-lg px-2 py-1 text-label-lg text-primary hover:bg-primary-fixed disabled:opacity-60">
          {moreBusy ? t('common.loading') : t('feed.moreComments')}
        </button>
      )}

      <div className="flex items-end gap-3">
        <Avatar user={me} size="sm" />
        <div className="flex min-w-0 flex-1 items-end gap-2 rounded-2xl bg-surface-low py-1.5 pl-4 pr-1.5 focus-within:bg-surface-lowest focus-within:ring-2 focus-within:ring-primary-container/40">
          <textarea
            value={text}
            rows={1}
            maxLength={1000}
            placeholder={isQuestion ? t('feed.answerPlaceholder') : t('feed.commentPlaceholder')}
            aria-label={isQuestion ? t('feed.answerPlaceholder') : t('feed.commentPlaceholder')}
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
            className="max-h-36 min-h-9 flex-1 resize-none self-center bg-transparent py-1.5 text-body-md text-on-surface outline-none placeholder:text-outline"
          />
          <button
            type="button"
            onClick={send}
            disabled={!text.trim() || sending}
            aria-label={t('feed.send')}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-white transition-colors hover:bg-primary-hover disabled:bg-surface-high disabled:text-outline"
          >
            {sending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  )
}