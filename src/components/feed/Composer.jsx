import { useEffect, useRef, useState } from 'react'
import { Film, ImagePlus, Link2, Loader2, Play, Send, X } from 'lucide-react'
import Avatar from '../Avatar'
import { CATEGORY } from './categories'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../lib/api'
import { errorKey, feedApi } from '../../lib/feed'
import { toHref } from '../../lib/links'
import { usePrefs } from '../../lib/prefs'
import { MAX_IMAGES, prepareMedia, uploadMedia } from '../../lib/postMedia'

const MAX_CHARS = 2000

export default function Composer({ onCreated, request }) {
  const { user } = useAuth()
  const { t } = usePrefs()
  const isAdmin = user?.role === 'admin'
  const categories = isAdmin ? ['general', 'question', 'summary', 'announcement'] : ['general', 'question', 'summary']

  const [category, setCategory] = useState('general')
  const [text, setText] = useState('')
  const [subject, setSubject] = useState('')
  const [media, setMedia] = useState([])
  const [progress, setProgress] = useState({})
  const [preparing, setPreparing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [linkError, setLinkError] = useState('')
  const linkInput = useRef(null)
  const uploaded = useRef(new Map())
  const mediaRef = useRef([])
  const photoInput = useRef(null)
  const videoInput = useRef(null)
  const textRef = useRef(null)

  useEffect(() => () => mediaRef.current.forEach((m) => URL.revokeObjectURL(m.previewUrl)), [])

  // The big buttons of the page header ("Ask a question", "Share a link"...) open the composer in the right mode.
  useEffect(() => {
    if (!request) return
    setCategory(request.category || 'general')
    setLinkOpen(Boolean(request.link))
    setTimeout(() => {
      textRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // read the refs AFTER the link field has been drawn
      const target = request.link ? linkInput.current : textRef.current
      target?.focus({ preventScroll: true })
    }, 80)
  }, [request])

  const trimmed = text.trim()
  const expanded = focused || linkOpen || text.length > 0 || media.length > 0
  const hasVideo = media.some((m) => m.kind === 'video')
  const canPublish = !busy && !preparing && (trimmed.length > 0 || media.length > 0) && trimmed.length <= MAX_CHARS
  const percents = Object.values(progress)
  const overall = percents.length ? Math.round(percents.reduce((a, b) => a + b, 0) / media.length) : 0

  async function addFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return
    setError('')
    setPreparing(true)
    let list = [...mediaRef.current]
    try {
      for (const file of files) {
        const isVideo = file.type.startsWith('video/')
        if ((isVideo && list.length) || (!isVideo && list.some((m) => m.kind === 'video'))) {
          setError(t('feed.mixed'))
          continue
        }
        if (!isVideo && list.length >= MAX_IMAGES) {
          setError(t('feed.photosLimit'))
          break
        }
        try {
          const item = await prepareMedia(file)
          list = [...list, item]
          mediaRef.current = list
          setMedia(list)
        } catch (err) {
          setError(t(`feed.media.${err.code || 'decode'}`))
        }
      }
    } finally {
      setPreparing(false)
    }
  }

  function addLink() {
    const href = toHref(linkValue)
    if (!href) {
      setLinkError(t('links.invalid'))
      return
    }
    setText((prev) => (prev.trim() ? `${prev.replace(/\s+$/, '')}\n${href}` : href))
    setLinkValue('')
    setLinkError('')
    setLinkOpen(false)
    setTimeout(() => textRef.current?.focus(), 30)
  }

  function removeMedia(id) {
    const item = mediaRef.current.find((m) => m.id === id)
    if (item) URL.revokeObjectURL(item.previewUrl)
    uploaded.current.delete(id)
    mediaRef.current = mediaRef.current.filter((m) => m.id !== id)
    setMedia(mediaRef.current)
  }

  function reset() {
    mediaRef.current.forEach((m) => URL.revokeObjectURL(m.previewUrl))
    mediaRef.current = []
    uploaded.current.clear()
    setMedia([])
    setProgress({})
    setText('')
    setSubject('')
    setCategory('general')
    setFocused(false)
    setLinkOpen(false)
    setLinkValue('')
    setLinkError('')
    if (textRef.current) textRef.current.style.height = 'auto'
  }

  async function publish() {
    if (!canPublish) return
    setBusy(true)
    setError('')
    try {
      const attachments = []
      for (const item of media) {
        let done = uploaded.current.get(item.id)
        if (!done) {
          done = await uploadMedia(item, (p) => setProgress((prev) => ({ ...prev, [item.id]: p })))
          uploaded.current.set(item.id, done)
        }
        attachments.push(done)
      }
      const payload = { category, attachments }
      if (trimmed) payload.content = trimmed
      if (subject.trim() && category !== 'general' && category !== 'announcement') payload.subject = subject.trim()
      const post = await feedApi.create(payload)
      reset()
      onCreated(post)
    } catch (err) {
      setError(err instanceof ApiError ? t(errorKey(err)) : t('feed.media.upload'))
    } finally {
      setBusy(false)
    }
  }

  const pill = (active) =>
    `inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-display text-label-md transition-colors ${
      active ? 'bg-primary-container text-white shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-high hover:text-on-surface'
    }`
  const tool =
    'inline-flex h-10 items-center gap-2 rounded-xl px-3 font-display text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-45'

  return (
    <section
      aria-label={t('feed.composer')}
      className="relative overflow-hidden rounded-3xl border border-outline-variant/70 bg-surface-lowest p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_20px_40px_-20px_rgba(13,92,58,0.28)] sm:p-5"
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary-container via-[#22c55e] to-secondary" />
      <div className="flex gap-3 pt-1">
        <Avatar user={user} size="md" className="hidden sm:flex" />
        <div className="min-w-0 flex-1">
          {expanded && (
            <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label={t('feed.composerType')}>
              {categories.map((key) => {
                const { Icon } = CATEGORY[key]
                return (
                  <button key={key} type="button" onClick={() => setCategory(key)} aria-pressed={category === key} className={pill(category === key)}>
                    <Icon className="size-3.5" aria-hidden="true" />
                    {t(`feed.categories.${key}`)}
                  </button>
                )
              })}
            </div>
          )}

          <textarea
            ref={textRef}
            value={text}
            rows={expanded ? 3 : 2}
            maxLength={MAX_CHARS + 200}
            disabled={busy}
            placeholder={t(`feed.placeholder.${category}`)}
            aria-label={t(`feed.placeholder.${category}`)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => setText(e.target.value)}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 260)}px`
            }}
            className="w-full resize-none rounded-2xl border border-transparent bg-surface-low px-4 py-3 text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary-container/60 focus:bg-surface-lowest"
          />

          {expanded && (category === 'question' || category === 'summary') && (
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={60}
              disabled={busy}
              placeholder={t('feed.subjectPlaceholder')}
              aria-label={t('feed.subjectPlaceholder')}
              className="mt-2 h-11 w-full rounded-xl border border-transparent bg-surface-low px-4 text-body-md text-on-surface outline-none placeholder:text-outline focus:border-primary-container/60 focus:bg-surface-lowest"
            />
          )}

          {linkOpen && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" aria-hidden="true" />
                  <input
                    ref={linkInput}
                    value={linkValue}
                    onChange={(e) => {
                      setLinkValue(e.target.value)
                      setLinkError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addLink()
                      }
                    }}
                    inputMode="url"
                    autoComplete="off"
                    disabled={busy}
                    placeholder={t('links.placeholder')}
                    aria-label={t('links.placeholder')}
                    aria-invalid={linkError ? 'true' : undefined}
                    className={`h-11 w-full rounded-xl border bg-surface-low pl-10 pr-3 text-body-md text-on-surface outline-none placeholder:text-outline focus:border-primary-container/60 focus:bg-surface-lowest ${linkError ? 'border-error' : 'border-transparent'}`}
                  />
                </div>
                <button type="button" onClick={addLink} className="h-11 rounded-xl bg-primary-fixed px-4 font-display text-label-lg text-on-primary-fixed hover:bg-primary-fixed/70">
                  {t('links.add')}
                </button>
                <button type="button" onClick={() => { setLinkOpen(false); setLinkError('') }} aria-label={t('common.close')} className="flex size-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container">
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              {linkError && <p role="alert" className="mt-1.5 text-body-sm text-error">{linkError}</p>}
            </div>
          )}

          {media.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2.5">
              {media.map((item) => (
                <li key={item.id} className="relative size-24 overflow-hidden rounded-xl bg-surface-container ring-1 ring-outline-variant/60">
                  {item.kind === 'image' ? (
                    <img src={item.previewUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <>
                      <video src={item.previewUrl} muted playsInline preload="metadata" className="size-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                        <Play className="size-7 fill-current" aria-hidden="true" />
                      </span>
                    </>
                  )}
                  <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-px text-label-sm font-semibold text-white">
                    {item.sizeKb >= 1024 ? `${(item.sizeKb / 1024).toFixed(1)} MB` : `${item.sizeKb} KB`}
                  </span>
                  {busy ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 font-display text-label-lg font-bold text-white">
                      {progress[item.id] ?? 0}%
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeMedia(item.id)}
                      aria-label={t('feed.removeMedia')}
                      className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
              {preparing && (
                <li className="flex size-24 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant" role="status">
                  <Loader2 className="size-5 animate-spin" aria-label={t('feed.preparing')} />
                </li>
              )}
            </ul>
          )}

          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-error-container px-3.5 py-2.5 text-body-sm text-on-error-container">
              {error}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1">
            <button type="button" className={tool} disabled={busy || preparing || hasVideo || media.length >= MAX_IMAGES} onClick={() => photoInput.current?.click()}>
              <ImagePlus className="size-5 text-primary" aria-hidden="true" />
              {t('feed.addPhotos')}
            </button>
            <button type="button" className={tool} disabled={busy || preparing || media.length > 0} onClick={() => videoInput.current?.click()}>
              <Film className="size-5 text-secondary" aria-hidden="true" />
              {t('feed.addVideo')}
            </button>
            <button type="button" className={tool} disabled={busy} onClick={() => setLinkOpen((v) => !v)} aria-pressed={linkOpen}>
              <Link2 className="size-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              {t('links.add_tool')}
            </button>

            <div className="ml-auto flex items-center gap-3">
              {trimmed.length > MAX_CHARS - 400 && (
                <span className={`text-label-md tabular-nums ${trimmed.length > MAX_CHARS ? 'font-bold text-error' : 'text-on-surface-variant'}`}>
                  {trimmed.length}/{MAX_CHARS}
                </span>
              )}
              <button
                type="button"
                onClick={publish}
                disabled={!canPublish}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary-container px-5 font-display text-label-lg text-white shadow-sm transition-all hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-surface-high disabled:text-outline disabled:shadow-none"
              >
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                {busy ? (media.length ? t('feed.uploading', { n: overall }) : t('feed.publishing')) : t('feed.publish')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <input ref={photoInput} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} data-testid="composer-photos" onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
      <input ref={videoInput} type="file" accept="video/mp4,video/quicktime,video/webm" className="sr-only" tabIndex={-1} data-testid="composer-video" onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
    </section>
  )
}