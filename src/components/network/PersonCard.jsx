import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, Check, Clock, Loader2, MapPin, MessageCircle, MoreHorizontal, UserMinus, UserPlus, X } from 'lucide-react'
import Avatar from '../Avatar'
import { abbreviate } from '../../lib/abbreviate'
import { usePrefs } from '../../lib/prefs'

/** One student with the right buttons for his relation to me. onAction(action) does the work. */
export default function PersonCard({ person, busy, onAction }) {
  const { t } = usePrefs()
  const { user, relation } = person
  const [menu, setMenu] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    if (!menu) return undefined
    const close = (e) => !box.current?.contains(e.target) && setMenu(false)
    const onKey = (e) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

  const place = [abbreviate(user.university), abbreviate(user.faculty)].filter(Boolean).join(', ')
  const base = 'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 font-display text-label-lg transition-all disabled:cursor-not-allowed disabled:opacity-60'
  const primary = `${base} bg-primary-container text-white shadow-sm hover:bg-primary-hover active:scale-[0.98]`
  const quiet = `${base} text-on-surface-variant hover:bg-surface-container hover:text-on-surface`
  const spin = <Loader2 className="size-4 animate-spin" aria-hidden="true" />

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-outline-variant/60 bg-surface-lowest p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_22px_-16px_rgba(13,92,58,0.2)] transition-shadow hover:shadow-[0_2px_4px_rgba(15,23,42,0.05),0_14px_30px_-14px_rgba(13,92,58,0.28)]">
      <Avatar user={user} size="md" />
      <div className="min-w-0 flex-1 basis-48">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="truncate font-display text-title-sm font-bold text-on-surface">
            {user.first_name} {user.last_name}
          </h3>
          {user.academic_level && (
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm font-semibold text-on-surface-variant">{t('card.level', { n: user.academic_level })}</span>
          )}
          {user.specialty && (
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm font-semibold text-on-surface-variant" title={user.specialty}>
              {abbreviate(user.specialty, { maxLetters: 4 })}
            </span>
          )}
        </div>
        {place && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-label-md text-on-surface-variant" title={[user.university, user.faculty].filter(Boolean).join(', ')}>
            <MapPin className="size-3.5 text-primary" aria-hidden="true" />
            {place}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {relation === 'none' && (
          <button type="button" className={primary} disabled={busy} onClick={() => onAction('add')}>
            {busy ? spin : <UserPlus className="size-4" aria-hidden="true" />}
            {t('friends.addFriend')}
          </button>
        )}
        {relation === 'request_sent' && (
          <>
            <span className={`${base} cursor-default bg-surface-container text-on-surface-variant`}>
              <Clock className="size-4" aria-hidden="true" />
              {t('friends.requestSent')}
            </span>
            <button type="button" className={quiet} disabled={busy} onClick={() => onAction('cancel')}>
              {busy ? spin : null}
              {t('friends.cancel')}
            </button>
          </>
        )}
        {relation === 'request_received' && (
          <>
            <button type="button" className={primary} disabled={busy} onClick={() => onAction('accept')}>
              {busy ? spin : <Check className="size-4" aria-hidden="true" />}
              {t('friends.accept')}
            </button>
            <button type="button" className={quiet} disabled={busy} onClick={() => onAction('reject')}>
              <X className="size-4" aria-hidden="true" />
              {t('friends.decline')}
            </button>
          </>
        )}
        {relation === 'friend' && (
          <Link to={`/messages/${user.id}`} className={primary}>
            <MessageCircle className="size-4" aria-hidden="true" />
            {t('friends.message')}
          </Link>
        )}

        {(relation === 'friend' || relation === 'none') && (
          <div className="relative" ref={box}>
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-label={t('friends.more')}
              aria-expanded={menu}
              className="flex size-10 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <MoreHorizontal className="size-5" aria-hidden="true" />
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-xl border border-outline-variant bg-surface-lowest p-1 shadow-xl">
                {relation === 'friend' && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false)
                      onAction('unfriend')
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-label-lg text-on-surface hover:bg-surface-container"
                  >
                    <UserMinus className="size-4" aria-hidden="true" />
                    {t('friends.unfriend')}
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false)
                    onAction('block')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-label-lg text-error hover:bg-error-container"
                >
                  <Ban className="size-4" aria-hidden="true" />
                  {t('friends.block')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  )
}