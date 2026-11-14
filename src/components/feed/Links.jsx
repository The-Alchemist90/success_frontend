import { ArrowUpRight, Globe } from 'lucide-react'
import { firstLink, splitLinks } from '../../lib/links'

const REL = 'noopener noreferrer nofollow ugc'

/** Text where every web address is a real clickable link (opens in a new tab). */
export function LinkText({ text }) {
  return (
    <>
      {splitLinks(text).map((part, i) =>
        part.type === 'link' ? (
          <a
            key={i}
            href={part.href}
            target="_blank"
            rel={REL}
            className="break-words font-medium text-primary underline decoration-primary/35 underline-offset-2 transition-colors hover:decoration-primary"
          >
            {part.value}
          </a>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </>
  )
}

/** A neat card for the first link of a post. Nothing is downloaded from the other site. */
export function LinkCard({ text }) {
  const link = firstLink(text)
  if (!link) return null
  return (
    <a
      href={link.href}
      target="_blank"
      rel={REL}
      className="group mt-3 flex items-center gap-3 rounded-xl border border-outline-variant/70 bg-surface-low p-3 transition-all hover:border-primary-container/60 hover:bg-primary-fixed/40"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
        <Globe className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-title-sm font-bold text-on-surface">{link.host}</span>
        <span className="block truncate text-label-md text-on-surface-variant">{link.path || link.href}</span>
      </span>
      <ArrowUpRight className="size-5 shrink-0 text-on-surface-variant transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
    </a>
  )
}