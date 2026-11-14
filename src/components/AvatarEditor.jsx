import { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { Alert, Spinner } from './ui'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'
import { removeAvatar, uploadAvatar } from '../lib/avatar'
import { prepareImage } from '../lib/image'
import { usePrefs } from '../lib/prefs'


export default function AvatarEditor() {
  const { user, updateUser } = useAuth()
  const { t } = usePrefs()
  const inputRef = useRef(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')
  const hasPhoto = Boolean(user?.profile_pic_cloudinary_id)

  function explain(err) {
    if (err?.code) return t(`avatar.errors.${err.code}`)
    if (err instanceof ApiError && err.status === 503) return t('avatar.errors.unavailable')
    return t('avatar.errors.upload')
  }

  async function onPick(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    let prepared = null
    try {
      prepared = await prepareImage(file)
      setProgress(0)
      updateUser(await uploadAvatar(prepared.blob, setProgress))
    } catch (err) {
      setError(explain(err))
    } finally {
      if (prepared) URL.revokeObjectURL(prepared.previewUrl)
      setProgress(null)
    }
  }

  async function onRemove() {
    setError('')
    setProgress(0)
    try {
      updateUser(await removeAvatar())
    } catch (err) {
      setError(explain(err))
    } finally {
      setProgress(null)
    }
  }

  const sending = progress !== null
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={sending}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary-container px-4 font-display text-label-lg text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {sending ? <Spinner /> : <Camera className="size-4" aria-hidden="true" />}
          {sending && progress > 0 ? `${progress} %` : hasPhoto ? t('avatar.change') : t('avatar.add')}
        </button>
        {hasPhoto && (
          <button
            type="button"
            onClick={onRemove}
            disabled={sending}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-3 font-display text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-60"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {t('avatar.remove')}
          </button>
        )}
      </div>
      {error && <Alert kind="error">{error}</Alert>}
      <input
        ref={inputRef}
        data-testid="avatar-editor-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={onPick}
      />
    </div>
  )
}