import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Alert, Button } from '../ui'
import { ApiError } from '../../lib/api'
import { errorKey, feedApi } from '../../lib/feed'
import { usePrefs } from '../../lib/prefs'

/** Bottom sheet on phones, centred dialog on larger screens. */
export function Modal({ title, onClose, children }) {
  const { t } = usePrefs()
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  // Rendered on <body>: a dialog inside an animated post card would be trapped in the card.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface-lowest p-6 shadow-2xl sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        <h2 className="pr-10 text-headline-sm text-on-surface">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({ title, text, confirmLabel, onConfirm, onClose }) {
  const { t } = usePrefs()
  const [busy, setBusy] = useState(false)
  async function run() {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <p className="mt-2 text-body-md text-on-surface-variant">{text}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          {t('common.cancel')}
        </Button>
        <Button onClick={run} loading={busy} className="bg-error hover:bg-error/90">
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

const REASONS = ['spam', 'harassment', 'inappropriate', 'cheating', 'other']

export function ReportDialog({ targetType, targetId, onClose, notify }) {
  const { t } = usePrefs()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!reason) {
      setError(t('feed.report.choose'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await feedApi.report({
        target_type: targetType,
        target_id: targetId,
        reason,
        ...(details.trim() ? { details: details.trim() } : {}),
      })
      notify(t('feed.report.done'))
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        notify(t('feed.report.already'))
        onClose()
        return
      }
      setError(t(errorKey(err)))
      setBusy(false)
    }
  }

  return (
    <Modal title={t('feed.report.title')} onClose={onClose}>
      <form onSubmit={submit} className="mt-2 flex flex-col gap-4">
        <p className="text-body-md text-on-surface-variant">{t('feed.report.intro')}</p>
        {error && <Alert kind="error">{error}</Alert>}
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">{t('feed.report.title')}</legend>
          {REASONS.map((key) => (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-body-md transition-colors ${
                reason === key
                  ? 'border-primary-container bg-primary-fixed text-on-primary-fixed'
                  : 'border-outline-variant text-on-surface hover:bg-surface-low'
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={key}
                checked={reason === key}
                onChange={() => setReason(key)}
                className="size-4 accent-primary-container"
              />
              {t(`feed.report.reasons.${key}`)}
            </label>
          ))}
        </fieldset>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t('feed.report.details')}
          className="w-full resize-none rounded-xl border border-transparent bg-surface-low px-3.5 py-2.5 text-body-md text-on-surface outline-none placeholder:text-outline focus:border-primary-container focus:bg-surface-lowest"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={busy}>
            {t('feed.report.send')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}