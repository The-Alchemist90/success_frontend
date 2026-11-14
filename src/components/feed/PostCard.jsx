import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Flag, Link2, MapPin, MessageCircle, MoreHorizontal, ThumbsUp, Trash2 } from 'lucide-react'
import Avatar from '../Avatar'
import Comments from './Comments'
import { ConfirmDialog, ReportDialog } from './Dialogs'
import { LinkCard, LinkText } from './Links'
import MediaGrid from './MediaGrid'
import { CATEGORY } from './categories'
import { abbreviate } from '../../lib/abbreviate'
import { errorKey, feedApi } from '../../lib/feed'
import { usePrefs } from '../../lib/prefs'
import { fullDate, timeAgo } from '../../lib/time'

const LONG_TEXT = 320

/** Cuts a long text without ever cutting a web address in half. */
function shortened(content) {
  const cut = content.slice(0, LONG_TEXT)
  const midWord = content[LONG_TEXT] && !/\s/.test(content[LONG_TEXT])
  const lastBreak = Math.max(cut.lastIndexOf(' '), cut.lastIndexOf('\n'))
  return (midWord && lastBreak > LONG_TEXT * 0.6 ? cut.slice(0, lastBreak) : cut).trimEnd()
}

export function PostSkeleton() {
  return (
    <div className="rounded-2xl border border-outline-variant/60 bg-surface-lowest p-5 sm:p-6" aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="skeleton size-12 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="skeleton h-3.5 w-40 rounded-full" />
          <div className="skeleton h-3 w-28 rounded-full" />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2.5">
        <div className="skeleton h-3.5 w-full rounded-full" />
        <div className="skeleton h-3.5 w-11/12 rounded-full" />
        <div className="skeleton h-3.5 w-2/3 rounded-full" />
      </div>
      <div className="skeleton mt-5 h-9 w-48 rounded-xl" />
    </div>
  )
}

export default function PostCard({ post, me, onPatch, onDeleted, notify, defaultComments = false }) {
  const { t, lang } = usePrefs()
  const [expanded, setExpanded] = useState(false)
  const [showComments, setShowComments] = useState(defaultComments)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dialog, setDialog] = useState(null) // 'delete' | 'report'
  const likeBusy = useRef(false)
  const menuRef = useRef(null)

  const category = CATEGORY[post.category] || CATEGORY.general
  const { Icon: CategoryIcon } = category
  const author = post.author
  const isQuestion = post.category === 'question'
  const mine = author.id === me.id

  useEffect(() => {
    if (!menuOpen) return undefined
    const close = (e) => !menuRef.current?.contains(e.target) && setMenuOpen(false)
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  async function toggleLike() {
    if (likeBusy.current) return
    likeBusy.current = true
    const next = !post.liked_by_me
    onPatch(post.id, { liked_by_me: next, likes_count: Math.max(0, post.likes_count + (next ? 1 : -1)) })
    try {
      const result = await feedApi.like(post.id, next)
      onPatch(post.id, { liked_by_me: result.liked, likes_count: result.likes_count })
    } catch (err) {
      onPatch(post.id, { liked_by_me: !next, likes_count: post.likes_count })
      notify(t(errorKey(err)), 'error')
    } finally {
      likeBusy.current = false
    }
  }

  async function copyLink() {
    setMenuOpen(false)
    const address = `${window.location.origin}/post/${post.id}`
    try {
      await navigator.clipboard.writeText(address)
      notify(t('links.copied'))
    } catch {
      window.prompt(t('links.copy'), address)
    }
  }

  async function remove() {
    try {
      await feedApi.remove(post.id)
      onDeleted(post.id)
      notify(t('feed.deleted'))
    } catch (err) {
      setDialog(null)
      notify(t(errorKey(err)), 'error')
    }
  }

  const content = post.content || ''
  const isLong = content.length > LONG_TEXT
  const shown = expanded || !isLong ? content : `${shortened(content)}…`
  const place = [abbreviate(author.university), abbreviate(author.faculty)].filter(Boolean).join(', ')
  const n = post.comments_count
  const commentLabel = isQuestion
    ? n === 0 ? t('feed.answer') : t(n === 1 ? 'feed.answerOne' : 'feed.answerMany', { n })
    : n === 0 ? t('feed.comment') : t(n === 1 ? 'feed.commentOne' : 'feed.commentMany', { n })

  const footerButton =
    'inline-flex h-10 items-center gap-2 rounded-xl px-3.5 font-display text-label-lg transition-colors'
  return (
    <article className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-lowest p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-14px_rgba(13,92,58,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_40px_-16px_rgba(13,92,58,0.26)] sm:p-6">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${category.rail}`} />

      <header className="flex items-start gap-3">
        <Avatar user={author} size="md" className="ring-2 ring-surface-lowest" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-display text-title-sm font-bold text-on-surface">
              {author.first_name} {author.last_name}
            </h3>
            {author.is_admin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-2 py-0.5 text-label-sm font-bold text-white">
                <BadgeCheck className="size-3" aria-hidden="true" />
                {t('feed.official')}
              </span>
            )}
            {author.academic_level && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm font-semibold text-on-surface-variant">
                {t('card.level', { n: author.academic_level })}
              </span>
            )}
            {author.specialty && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm font-semibold text-on-surface-variant" title={author.specialty}>
                {abbreviate(author.specialty, { maxLetters: 4 })}
              </span>
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-label-md text-on-surface-variant">
            {place && (
              <span className="inline-flex items-center gap-1" title={[author.university, author.faculty].filter(Boolean).join(', ')}>
                <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                {place}
              </span>
            )}
            <time dateTime={post.created_at} title={fullDate(post.created_at, lang)}>
              {timeAgo(post.created_at, lang)}
            </time>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-label-md sm:inline-flex ${category.chip}`}>
            <CategoryIcon className="size-3.5" aria-hidden="true" />
            {t(`feed.categories.${post.category}`)}
          </span>
          {(post.can_delete || !mine) && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={t('feed.more')}
                aria-expanded={menuOpen}
                className="flex size-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <MoreHorizontal className="size-5" aria-hidden="true" />
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-xl border border-outline-variant bg-surface-lowest p-1 shadow-xl">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={copyLink}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-label-lg text-on-surface hover:bg-surface-container"
                  >
                    <Link2 className="size-4" aria-hidden="true" />
                    {t('links.copy')}
                  </button>
                  {!mine && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        setDialog('report')
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-label-lg text-on-surface hover:bg-surface-container"
                    >
                      <Flag className="size-4" aria-hidden="true" />
                      {t('feed.report.menu')}
                    </button>
                  )}
                  {post.can_delete && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        setDialog('delete')
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-label-lg text-error hover:bg-error-container"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      {t('feed.delete')}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className={`mt-4 flex flex-wrap items-center gap-2 ${post.subject ? '' : 'sm:hidden'}`}>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-md sm:hidden ${category.chip}`}>
          <CategoryIcon className="size-3.5" aria-hidden="true" />
          {t(`feed.categories.${post.category}`)}
        </span>
        {post.subject && (
          <span className="inline-flex items-center gap-2 rounded-lg bg-surface-high px-3 py-1 text-label-md font-bold text-on-surface">
            <span className="size-2 rounded-full bg-secondary" aria-hidden="true" />
            {post.subject}
          </span>
        )}
      </div>

      {content && (
        <div className="mt-3">
          <p className="whitespace-pre-wrap break-words text-body-md text-on-surface">
            <LinkText text={shown} />
          </p>
          {isLong && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-label-lg text-primary hover:underline">
              {expanded ? t('feed.showLess') : t('feed.showMore')}
            </button>
          )}
        </div>
      )}

      <LinkCard text={content} />

      {post.attachments.length > 0 && (
        <div className="mt-4">
          <MediaGrid attachments={post.attachments} />
        </div>
      )}

      <footer className="mt-4 flex flex-wrap items-center gap-1 border-t border-outline-variant/50 pt-3">
        <button
          type="button"
          onClick={toggleLike}
          aria-pressed={post.liked_by_me}
          className={`${footerButton} ${post.liked_by_me ? 'bg-primary-fixed text-on-primary-fixed' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
        >
          <ThumbsUp className={`size-[18px] transition-transform ${post.liked_by_me ? 'scale-110 fill-current' : ''}`} aria-hidden="true" />
          {t('feed.helpful')}
          {post.likes_count > 0 && <span className="tabular-nums">{post.likes_count}</span>}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          className={`${footerButton} ${showComments ? 'bg-surface-container text-on-surface' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
        >
          <MessageCircle className="size-[18px]" aria-hidden="true" />
          {commentLabel}
        </button>
        {isQuestion && n === 0 && (
          <span className="ml-auto rounded-full bg-tertiary-fixed px-2.5 py-1 text-label-md text-on-tertiary-fixed">{t('feed.awaiting')}</span>
        )}
      </footer>

      {showComments && (
        <Comments post={post} me={me} notify={notify} onCountChange={(delta) => onPatch(post.id, { comments_count: Math.max(0, post.comments_count + delta) })} />
      )}

      {dialog === 'delete' && (
        <ConfirmDialog
          title={t('feed.deleteTitle')}
          text={t('feed.deleteText')}
          confirmLabel={t('feed.deleteConfirm')}
          onConfirm={remove}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'report' && <ReportDialog targetType="post" targetId={post.id} onClose={() => setDialog(null)} notify={notify} />}
    </article>
  )
}