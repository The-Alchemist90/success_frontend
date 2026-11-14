import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { usePrefs } from '../../lib/prefs'

function Lightbox({ images, index, onClose, onIndex }) {
  const { t } = usePrefs()
  const last = images.length - 1
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onIndex(Math.max(0, index - 1))
      if (e.key === 'ArrowRight') onIndex(Math.min(last, index + 1))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, last, onClose, onIndex])

  const arrow =
    'absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 disabled:opacity-30'
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('feed.photo', { n: index + 1 })}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <img src={images[index].url} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
      <button type="button" onClick={onClose} aria-label={t('common.close')} className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25">
        <X className="size-5" aria-hidden="true" />
      </button>
      {images.length > 1 && (
        <>
          <button type="button" className={`${arrow} left-4`} disabled={index === 0} onClick={() => onIndex(index - 1)} aria-label={t('feed.previous')}>
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>
          <button type="button" className={`${arrow} right-4`} disabled={index === last} onClick={() => onIndex(index + 1)} aria-label={t('feed.next')}>
            <ChevronRight className="size-6" aria-hidden="true" />
          </button>
        </>
      )}
    </div>,
    document.body,
  )
}

export default function MediaGrid({ attachments }) {
  const { t } = usePrefs()
  const [open, setOpen] = useState(null)
  const video = attachments.find((a) => a.kind === 'video' && a.url)
  const images = attachments.filter((a) => a.kind === 'image' && a.url)

  if (video) {
    return (
      <video
        controls
        playsInline
        preload="none"
        poster={video.poster_url || undefined}
        className="max-h-[28rem] w-full rounded-xl bg-black"
      >
        <source src={video.url} />
      </video>
    )
  }
  if (!images.length) return null

  const count = images.length
  const frame =
    count === 1 ? 'grid-cols-1 aspect-[16/10]' : count === 2 ? 'grid-cols-2 aspect-[16/10]' : 'grid-cols-2 grid-rows-2 aspect-[4/3]'
  return (
    <>
      <div className={`grid gap-1.5 overflow-hidden rounded-xl ${frame}`}>
        {images.map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={t('feed.photo', { n: i + 1 })}
            className={`group relative block h-full w-full overflow-hidden bg-surface-container ${count === 3 && i === 0 ? 'row-span-2' : ''}`}
          >
            <img
              src={image.url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </button>
        ))}
      </div>
      {open !== null && <Lightbox images={images} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </>
  )
}