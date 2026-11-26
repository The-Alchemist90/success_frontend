import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MessageCircle, PenSquare, Search } from 'lucide-react'
import Avatar from '../components/Avatar'
import Thread from '../components/chat/Thread'
import { Modal } from '../components/feed/Dialogs'
import { netApi } from '../lib/net'
import { useNetwork } from '../lib/network'
import { usePrefs } from '../lib/prefs'
import { timeAgo } from '../lib/time'

function ConversationItem({ conversation, active }) {
  const { t, lang } = usePrefs()
  const { user, last_message: last, unread } = conversation
  return (
    <Link
      to={`/messages/${user.id}`}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${active ? 'bg-primary-fixed' : 'hover:bg-surface-container'}`}
    >
      <Avatar user={user} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate font-display text-title-sm ${unread ? 'font-bold text-on-surface' : 'font-semibold text-on-surface'}`}>
            {user.first_name} {user.last_name}
          </p>
          <span className="shrink-0 text-label-sm text-on-surface-variant">{timeAgo(last.sent_at, lang)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-body-sm ${unread ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>
            {last.mine && <span className="text-on-surface-variant">{t('chat.you')}: </span>}
            {last.content}
          </p>
          {unread > 0 && <span className="min-w-5 shrink-0 rounded-full bg-secondary px-1.5 text-center text-label-sm font-bold leading-5 text-white" aria-label={t('chat.unread', { n: unread })}>{unread}</span>}
        </div>
      </div>
    </Link>
  )
}

export default function Messages() {
  const { userId } = useParams()
  const { t } = usePrefs()
  const navigate = useNavigate()
  const { refresh } = useNetwork()
  const [conversations, setConversations] = useState(null)
  const [friends, setFriends] = useState([])
  const [picker, setPicker] = useState(false)
  const [filter, setFilter] = useState('')

  const loadConversations = useCallback(() => {
    netApi
      .conversations()
      .then(setConversations)
      .catch(() => setConversations((prev) => prev ?? []))
  }, [])

  useEffect(() => {
    loadConversations()
    netApi.friends().then(setFriends).catch(() => {})
    const timer = setInterval(() => document.visibilityState === 'visible' && loadConversations(), 20000)
    return () => clearInterval(timer)
  }, [loadConversations])

  const peer = conversations?.find((c) => c.user.id === userId)?.user || friends.find((f) => f.user.id === userId)?.user
  const needle = filter.trim().toLowerCase()
  const shown = (conversations || []).filter((c) => !needle || `${c.user.first_name} ${c.user.last_name}`.toLowerCase().includes(needle))
  const onActivity = useCallback(() => {
    loadConversations()
    refresh()
  }, [loadConversations, refresh])

  return (
    <div className="mx-auto h-[calc(100dvh-4rem)] max-w-[1120px] lg:p-6">
      <div className="grid h-full overflow-hidden bg-surface-lowest lg:grid-cols-[340px_minmax(0,1fr)] lg:rounded-3xl lg:border lg:border-outline-variant/60 lg:shadow-[0_1px_3px_rgba(15,23,42,0.05),0_24px_48px_-24px_rgba(13,92,58,0.3)]">
        <section className={`${userId ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-outline-variant/60 lg:border-r`}>
          <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-5">
            <h1 className="text-headline-sm text-on-surface">{t('chat.title')}</h1>
            <button type="button" onClick={() => setPicker(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary-container px-3.5 font-display text-label-lg text-white shadow-sm hover:bg-primary-hover">
              <PenSquare className="size-4" aria-hidden="true" />
              {t('chat.newMessage')}
            </button>
          </div>
          {(conversations || []).length > 4 && (
            <div className="relative mx-4 mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" aria-hidden="true" />
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t('friends.searchFriends')} aria-label={t('friends.searchFriends')} className="h-10 w-full rounded-xl bg-surface-low pl-9 pr-3 text-body-sm text-on-surface outline-none placeholder:text-outline focus:ring-2 focus:ring-primary-container/40" />
            </div>
          )}
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            {conversations === null && (
              <div className="flex flex-col gap-2 px-2" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-2xl" />
                ))}
              </div>
            )}
            {conversations && conversations.length === 0 && (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed">
                  <MessageCircle className="size-7" aria-hidden="true" />
                </span>
                <h2 className="text-title-md text-on-surface">{t('chat.emptyTitle')}</h2>
                <p className="text-body-sm text-on-surface-variant">{t('chat.emptyText')}</p>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {shown.map((c) => (
                <ConversationItem key={c.user.id} conversation={c} active={c.user.id === userId} />
              ))}
            </div>
          </div>
        </section>

        <section className={`${userId ? 'flex' : 'hidden lg:flex'} min-h-0 min-w-0 flex-col`}>
          {userId ? (
            <Thread key={userId} userId={userId} peer={peer} onActivity={onActivity} />
          ) : (
            <div className="m-auto flex max-w-xs flex-col items-center gap-3 px-6 text-center">
              <span className="flex size-16 items-center justify-center rounded-3xl bg-primary-fixed text-on-primary-fixed">
                <MessageCircle className="size-8" aria-hidden="true" />
              </span>
              <h2 className="text-title-md text-on-surface">{t('chat.selectTitle')}</h2>
              <p className="text-body-md text-on-surface-variant">{t('chat.selectText')}</p>
            </div>
          )}
        </section>
      </div>

      {picker && (
        <Modal title={t('chat.chooseFriend')} onClose={() => setPicker(false)}>
          <div className="mt-4 flex max-h-[55dvh] flex-col gap-1 overflow-y-auto">
            {friends.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-body-md text-on-surface-variant">{t('chat.noFriendsToChat')}</p>
                <Link to="/friends?tab=discover" onClick={() => setPicker(false)} className="inline-flex h-10 items-center rounded-xl bg-primary-container px-4 font-display text-label-lg text-white hover:bg-primary-hover">{t('friends.findPeople')}</Link>
              </div>
            )}
            {friends.map(({ user }) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  setPicker(false)
                  navigate(`/messages/${user.id}`)
                }}
                className="flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-surface-container"
              >
                <Avatar user={user} size="sm" />
                <span className="min-w-0 flex-1 truncate font-display text-label-lg text-on-surface">
                  {user.first_name} {user.last_name}
                </span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}