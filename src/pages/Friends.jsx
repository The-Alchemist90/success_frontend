import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, Ban, Loader2, RotateCw, Search, UserSearch, UsersRound, X } from 'lucide-react'
import { ConfirmDialog, Modal } from '../components/feed/Dialogs'
import PersonCard from '../components/network/PersonCard'
import Avatar from '../components/Avatar'
import { Button } from '../components/ui'
import { netApi, netErrorKey } from '../lib/net'
import { useNetwork } from '../lib/network'
import { usePrefs } from '../lib/prefs'
import { useToast } from '../lib/toast'

const TABS = ['friends', 'requests', 'discover']
const PAGE = 12

function PersonSkeleton() {
  return (
    <li className="flex items-center gap-4 rounded-2xl border border-outline-variant/60 bg-surface-lowest p-4" aria-hidden="true">
      <div className="skeleton size-12 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton h-4 w-44 rounded-full" />
        <div className="skeleton h-3 w-28 rounded-full" />
      </div>
      <div className="skeleton h-10 w-28 rounded-xl" />
    </li>
  )
}

function Empty({ Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline-variant px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h2 className="text-title-md text-on-surface">{title}</h2>
      {text && <p className="max-w-sm text-body-md text-on-surface-variant">{text}</p>}
      {children}
    </div>
  )
}

export default function Friends() {
  const { t } = usePrefs()
  const { summary, refresh } = useNetwork()
  const { notify, toast } = useToast()
  const [params, setParams] = useSearchParams()
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'friends'
  const setTab = (key) => setParams(key === 'friends' ? {} : { tab: key }, { replace: true })

  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [friends, setFriends] = useState(null)
  const [incoming, setIncoming] = useState(null)
  const [outgoing, setOutgoing] = useState(null)
  const [people, setPeople] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [moreBusy, setMoreBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [blockedOpen, setBlockedOpen] = useState(false)

  useEffect(() => {
    setSearch('')
    setQ('')
  }, [tab])
  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let alive = true
    setFailed(false)
    const fail = () => alive && setFailed(true)
    if (tab === 'friends') {
      netApi.friends(q || undefined).then((list) => alive && setFriends(list)).catch(fail)
    } else if (tab === 'requests') {
      Promise.all([netApi.requests('incoming'), netApi.requests('outgoing')])
        .then(([a, b]) => {
          if (!alive) return
          setIncoming(a)
          setOutgoing(b)
        })
        .catch(fail)
    } else {
      const query = q.length >= 2 ? q : undefined
      setPeople(null)
      netApi
        .people({ q: query, limit: PAGE })
        .then((list) => {
          if (!alive) return
          setPeople(list)
          setHasMore(list.length === PAGE)
        })
        .catch(fail)
    }
    return () => {
      alive = false
    }
  }, [tab, q, reloadKey])

  async function loadMore() {
    setMoreBusy(true)
    try {
      const list = await netApi.people({ q: q.length >= 2 ? q : undefined, limit: PAGE, offset: people.length })
      setPeople((prev) => {
        const seen = new Set(prev.map((p) => p.user.id))
        return [...prev, ...list.filter((p) => !seen.has(p.user.id))]
      })
      setHasMore(list.length === PAGE)
    } catch (err) {
      notify(t(netErrorKey(err)), 'error')
    } finally {
      setMoreBusy(false)
    }
  }

  const done = () => {
    setReloadKey((k) => k + 1)
    refresh()
  }

  async function act(action, person) {
    const name = person.user.first_name
    if (action === 'unfriend' || action === 'block') {
      setConfirm({ action, person })
      return
    }
    setBusyId(person.user.id)
    try {
      if (action === 'add') {
        const result = await netApi.sendRequest(person.user.id)
        notify(result.status === 'friends' ? t('friends.nowFriends', { name }) : t('friends.sentTo', { name }))
      } else if (action === 'cancel') {
        await netApi.cancel(person.request_id)
        notify(t('friends.cancelled'))
      } else if (action === 'accept') {
        await netApi.accept(person.request_id)
        notify(t('friends.nowFriends', { name }))
      } else if (action === 'reject') {
        await netApi.reject(person.request_id)
        notify(t('friends.declined'))
      }
      done()
    } catch (err) {
      notify(t(netErrorKey(err)), 'error')
      done()
    } finally {
      setBusyId(null)
    }
  }

  async function confirmed() {
    const { action, person } = confirm
    const name = person.user.first_name
    try {
      if (action === 'unfriend') {
        await netApi.unfriend(person.user.id)
        notify(t('friends.unfriended', { name }))
      } else {
        await netApi.block(person.user.id)
        notify(t('friends.blockedOk', { name }))
      }
    } catch (err) {
      notify(t(netErrorKey(err)), 'error')
    }
    setConfirm(null)
    done()
  }

  const requestItems = [
    ...(incoming || []).map((r) => ({ user: r.user, relation: 'request_received', request_id: r.id })),
  ]
  const sentItems = (outgoing || []).map((r) => ({ user: r.user, relation: 'request_sent', request_id: r.id }))
  const friendItems = (friends || []).map((f) => ({ user: f.user, relation: 'friend' }))

  const pill = (active) =>
    `inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 font-display text-label-lg transition-all ${
      active ? 'bg-on-surface text-surface shadow-sm' : 'bg-surface-lowest text-on-surface-variant ring-1 ring-outline-variant/70 hover:text-on-surface hover:ring-outline'
    }`
  const loading = (tab === 'friends' && friends === null) || (tab === 'requests' && incoming === null) || (tab === 'discover' && people === null)

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 font-display text-label-md text-on-primary-fixed">
            <UsersRound className="size-4" aria-hidden="true" />
            {t('friends.badge', { n: summary.friends })}
          </span>
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">{t('friends.title')}</h1>
          <p className="max-w-xl text-body-md text-on-surface-variant">{t('friends.subtitle')}</p>
        </div>
        <button type="button" onClick={() => setBlockedOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl px-3.5 font-display text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
          <Ban className="size-4" aria-hidden="true" />
          {t('friends.blockedList')}
        </button>
      </header>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
        {TABS.map((key) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={pill(tab === key)}>
            {t(`friends.tabs.${key}`)}
            {key === 'requests' && summary.incoming_requests > 0 && (
              <span className="rounded-full bg-secondary px-2 py-px text-label-sm font-bold text-white">{summary.incoming_requests}</span>
            )}
          </button>
        ))}
      </div>

      {tab !== 'requests' && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'friends' ? t('friends.searchFriends') : t('friends.searchPeople')}
            aria-label={tab === 'friends' ? t('friends.searchFriends') : t('friends.searchPeople')}
            className="h-12 w-full rounded-xl border border-transparent bg-surface-lowest pl-10 pr-9 text-body-md text-on-surface outline-none ring-1 ring-outline-variant/70 placeholder:text-outline focus:ring-2 focus:ring-primary-container/60"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label={t('common.close')} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container">
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {failed && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline-variant px-6 py-12 text-center">
          <AlertCircle className="size-9 text-error" aria-hidden="true" />
          <p className="text-body-md text-on-surface-variant">{t('friends.loadError')}</p>
          <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
            <RotateCw className="size-4" aria-hidden="true" />
            {t('feed.retry')}
          </Button>
        </div>
      )}

      {!failed && loading && (
        <ul className="flex flex-col gap-3" role="status" aria-label={t('common.loading')}>
          <PersonSkeleton />
          <PersonSkeleton />
          <PersonSkeleton />
        </ul>
      )}

      {!failed && !loading && tab === 'friends' && (
        friendItems.length === 0 ? (
          <Empty Icon={UsersRound} title={q ? t('friends.noMatchTitle') : t('friends.emptyFriendsTitle')} text={q ? t('friends.noMatch') : t('friends.emptyFriends')}>
            {!q && <Button onClick={() => setTab('discover')}>{t('friends.findPeople')}</Button>}
          </Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {friendItems.map((p) => (
              <PersonCard key={p.user.id} person={p} busy={busyId === p.user.id} onAction={(a) => act(a, p)} />
            ))}
          </ul>
        )
      )}

      {!failed && !loading && tab === 'requests' && (
        requestItems.length === 0 && sentItems.length === 0 ? (
          <Empty Icon={UsersRound} title={t('friends.emptyRequestsTitle')} text={t('friends.emptyRequests')}>
            <Button onClick={() => setTab('discover')}>{t('friends.findPeople')}</Button>
          </Empty>
        ) : (
          <div className="flex flex-col gap-6">
            {requestItems.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-title-md text-on-surface">{t('friends.incoming')}</h2>
                <ul className="flex flex-col gap-3">
                  {requestItems.map((p) => (
                    <PersonCard key={p.request_id} person={p} busy={busyId === p.user.id} onAction={(a) => act(a, p)} />
                  ))}
                </ul>
              </section>
            )}
            {sentItems.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-title-md text-on-surface">{t('friends.outgoing')}</h2>
                <ul className="flex flex-col gap-3">
                  {sentItems.map((p) => (
                    <PersonCard key={p.request_id} person={p} busy={busyId === p.user.id} onAction={(a) => act(a, p)} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )
      )}

      {!failed && !loading && tab === 'discover' && (
        people.length === 0 ? (
          <Empty Icon={UserSearch} title={t('friends.emptyDiscoverTitle')} text={q ? t('friends.emptyDiscover') : t('friends.emptySuggestions')} />
        ) : (
          <section className="flex flex-col gap-3">
            <h2 className="text-title-md text-on-surface">{q.length >= 2 ? t('friends.results') : t('friends.suggestions')}</h2>
            <ul className="flex flex-col gap-3">
              {people.map((p) => (
                <PersonCard key={p.user.id} person={p} busy={busyId === p.user.id} onAction={(a) => act(a, p)} />
              ))}
            </ul>
            {hasMore && (
              <Button variant="outline" onClick={loadMore} loading={moreBusy} className="self-center">
                {moreBusy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {t('friends.loadMore')}
              </Button>
            )}
          </section>
        )
      )}

      {confirm && (
        <ConfirmDialog
          title={t(confirm.action === 'unfriend' ? 'friends.unfriendTitle' : 'friends.blockTitle', { name: confirm.person.user.first_name })}
          text={t(confirm.action === 'unfriend' ? 'friends.unfriendText' : 'friends.blockText')}
          confirmLabel={t(confirm.action === 'unfriend' ? 'friends.unfriendConfirm' : 'friends.blockConfirm')}
          onConfirm={confirmed}
          onClose={() => setConfirm(null)}
        />
      )}
      {blockedOpen && <BlockedDialog onClose={() => setBlockedOpen(false)} notify={notify} onChanged={done} />}
      {toast}
    </div>
  )
}

function BlockedDialog({ onClose, notify, onChanged }) {
  const { t } = usePrefs()
  const [items, setItems] = useState(null)
  useEffect(() => {
    let alive = true
    netApi
      .blocks()
      .then((list) => alive && setItems(list))
      .catch(() => alive && setItems([]))
    return () => {
      alive = false
    }
  }, [])
  async function unblock(item) {
    try {
      await netApi.unblock(item.user.id)
      setItems((prev) => prev.filter((i) => i.user.id !== item.user.id))
      notify(t('friends.unblocked', { name: item.user.first_name }))
      onChanged()
    } catch (err) {
      notify(t(netErrorKey(err)), 'error')
    }
  }
  return (
    <Modal title={t('friends.blockedTitle')} onClose={onClose}>
      <div className="mt-4 flex flex-col gap-2">
        {items === null && <div className="skeleton h-14 rounded-xl" aria-hidden="true" />}
        {items?.length === 0 && <p className="py-6 text-center text-body-md text-on-surface-variant">{t('friends.blockedEmpty')}</p>}
        {items?.map((item) => (
          <div key={item.user.id} className="flex items-center gap-3 rounded-xl bg-surface-low p-3">
            <Avatar user={item.user} size="sm" />
            <span className="min-w-0 flex-1 truncate font-display text-label-lg text-on-surface">
              {item.user.first_name} {item.user.last_name}
            </span>
            <button type="button" onClick={() => unblock(item)} className="h-9 rounded-lg px-3 font-display text-label-lg text-primary hover:bg-primary-fixed">
              {t('friends.unblock')}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  )
}