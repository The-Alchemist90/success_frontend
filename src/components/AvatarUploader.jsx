import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, ImagePlus, Trash2 } from 'lucide-react'
import { Spinner } from './ui'
import { prepareImage } from '../lib/image'
import { usePrefs } from '../lib/prefs'

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function AvatarUploader({ value, onChange, error, required = false, progress = null, disabled = false }) {
  const { t } = usePrefs()
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState('')
  const previewRef = useRef(null)

  // free the browser memory used by the preview when it is replaced or when the page closes
  useEffect(() => {
    if (previewRef.current && previewRef.current !== value?.previewUrl) URL.revokeObjectURL(previewRef.current)
    previewRef.current = value?.previewUrl ?? null
  }, [value])
  useEffect(() => () => previewRef.current && URL.revokeObjectURL(previewRef.current), [])

  async function handleFile(file) {
    if (!file || disabled) return
    setLocalError('')
    setBusy(true)
    try {
      onChange(await prepareImage(file))
    } catch (err) {
      setLocalError(t(`avatar.errors.${err.code || 'decode'}`))
    } finally {
      setBusy(false)
    }
  }

  const uploading = progress !== null
  const shownError = localError || error
  const pick = () => !disabled && inputRef.current?.click()

  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl bg-surface-low p-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <button
          type="button"
          id="avatar"
          onClick={pick}
          disabled={disabled}
          aria-label={value ? t('avatar.change') : t('avatar.choose')}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
          className={`group relative flex size-28 items-center justify-center overflow-hidden rounded-full transition-all ${
            value
              ? 'ring-4 ring-primary-container/30'
              : `border-2 border-dashed ${dragging ? 'scale-105 border-primary-container bg-primary-fixed' : 'border-outline bg-surface-lowest hover:border-primary-container'}`
          }`}
        >
          {value ? (
            <>
              <img src={value.previewUrl} alt="" className="size-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Camera className="size-7 text-white" aria-hidden="true" />
              </span>
            </>
          ) : busy ? (
            <Spinner className="size-7 text-primary" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-on-surface-variant">
              <ImagePlus className="size-8 text-primary" aria-hidden="true" />
              <span className="text-label-sm uppercase">{t('avatar.add')}</span>
            </span>
          )}
        </button>

        {uploading && (
          <svg viewBox="0 0 112 112" className="pointer-events-none absolute inset-0 size-28 -rotate-90" aria-hidden="true">
            <circle cx="56" cy="56" r={RADIUS} fill="rgba(0,0,0,0.35)" />
            <circle
              cx="56" cy="56" r={RADIUS} fill="none" stroke="#a9f3c5" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
              className="transition-[stroke-dashoffset] duration-200"
            />
          </svg>
        )}
        {uploading && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-label-lg font-bold text-white">
            {progress}%
          </span>
        )}
        {value && !uploading && (
          <span className="absolute bottom-0.5 right-0.5 flex size-7 items-center justify-center rounded-full bg-primary-container text-white shadow-md">
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <span className="font-display text-title-sm font-bold text-on-surface">
            {t('avatar.title')}
            {required && ' *'}
          </span>
          {value && (
            <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-label-md text-on-primary-fixed">
              {t('avatar.ready', { size: value.sizeKb })}
            </span>
          )}
        </div>
        <p className="text-body-sm text-on-surface-variant">{t('avatar.hint')}</p>
        <p className="text-label-md text-on-surface-variant/80">{t('avatar.formats')}</p>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
          <button
            type="button"
            onClick={pick}
            disabled={disabled}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-container px-3.5 font-display text-label-lg text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            <Camera className="size-4" aria-hidden="true" />
            {value ? t('avatar.change') : t('avatar.choose')}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled}
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3 font-display text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-60"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {t('avatar.remove')}
            </button>
          )}
        </div>
        {shownError && (
          <p className="text-body-sm text-error" role="alert">
            {shownError}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        data-testid="avatar-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = '' // lets the student pick the same file again later
        }}
      />
    </div>
  )
}