import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellRing, CheckCheck, MessageCircle, ThumbsUp } from 'lucide-react'
import Avatar from '../Avatar'
import { useNotifications } from '../../lib/notifications'
import { usePrefs } from '../../lib/prefs'
import { timeAgo } from '../../lib/time'

export function NotificationItem({ n, onOpen }) {
  const { t, lang } = usePrefs()
  const name = n.actor ? `${n.actor.first_name} ${n.actor.last_name}` : t('notif.someone')
  const isLike = n.type === 'post_like'
  const action = isLike ? t('notif.liked') : n.category === 'question' ? t('notif.answered') : t('notif.commented')
  const Badge = isLike ? ThumbsUp : MessageCircle
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-surface-container ${n.is_read ? '' : 'bg-primary-fixed/40'}`}
    >
      <span className="relative shrink-0">
        <Avatar user={n.actor} size="sm" />
        <span className={`absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full ring-2 ring-surface-lowest ${isLike ? 'bg-secondary text-white' : 'bg-primary-container text-white'}`}>
          <Badge className="size-2.5" aria-hidden="true" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm text-on-surface">
          <strong className="font-display font-bold">{name}</strong> {action}
        </span>
        {n.snippet && <span className="mt-0.5 line-clamp-1 block text-label-md text-on-surface-variant">“{n.snippet}”</span>}
        <span className="mt-0.5 block text-label-md text-outline">{timeAgo(n.created_at, lang)}</span>
      </span>
      {!n.is_read && <span className="mt-2 size-2 shrink-0 rounded-full bg-secondary" aria-label={t('notif.unreadDot')} />}
    </button>
  )
}

export default function NotificationBell() {
  const { t } = usePrefs()
  const navigate = useNavigate()
  const { items, unread, markRead, markAll, refresh } = useNotifications()
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (e) => !box.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function openItem(n) {
    markRead(n.id)
    setOpen(false)
    if (n.post_id) navigate(`/post/${n.post_id}`)
  }

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) refresh()
        }}
        aria-label={unread ? t('notif.bellUnread', { n: unread }) : t('notif.title')}
        aria-expanded={open}
        className="relative flex size-9 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-high hover:text-on-surface"
      >
        {unread > 0 ? <BellRing className="size-5" aria-hidden="true" /> : <Bell className="size-5" aria-hidden="true" />}
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-surface">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[4.25rem] z-50 overflow-hidden rounded-2xl border border-outline-variant bg-surface-lowest shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[24rem]">
          <div className="flex items-center justify-between gap-2 border-b border-outline-variant/60 px-4 py-3">
            <h2 className="text-title-sm text-on-surface">{t('notif.title')}</h2>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-label-md text-primary hover:bg-primary-fixed">
                <CheckCheck className="size-4" aria-hidden="true" />
                {t('notif.markAll')}
              </button>
            )}
          </div>
          <div className="scroll-thin max-h-[26rem] overflow-y-auto p-2">
            {items.length === 0 ? (
              <p className="px-3 py-8 text-center text-body-sm text-on-surface-variant">{t('notif.empty')}</p>
            ) : (
              items.map((n) => <NotificationItem key={n.id} n={n} onOpen={openItem} />)
            )}
          </div>
        </div>
      )}
    </div>
  )
}