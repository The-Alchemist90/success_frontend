const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"']+/gi
const TRAILING = /[.,;:!?)\]}»”’]+$/

/** Returns a safe https/http address, or null. Anything else (javascript:, mailto:, user:pass@...) is refused. */
export function toHref(raw) {
  const value = (raw || '').trim()
  if (!value || /\s/.test(value)) return null
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    if (!url.hostname.includes('.') || url.hostname.endsWith('.')) return null
    return url.href
  } catch {
    return null
  }
}

/** Cuts a text into plain parts and link parts. */
export function splitLinks(text) {
  const parts = []
  let last = 0
  for (const match of (text || '').matchAll(URL_RE)) {
    let raw = match[0]
    const trail = raw.match(TRAILING)?.[0] || ''
    if (trail) raw = raw.slice(0, raw.length - trail.length)
    const href = toHref(raw)
    if (!href) continue
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) })
    parts.push({ type: 'link', value: raw, href })
    last = match.index + raw.length
  }
  if (last < (text || '').length) parts.push({ type: 'text', value: text.slice(last) })
  return parts
}

/** The first link of a text: { href, host, path } or null. */
export function firstLink(text) {
  const part = splitLinks(text).find((p) => p.type === 'link')
  if (!part) return null
  const url = new URL(part.href)
  const path = `${url.pathname === '/' ? '' : url.pathname}${url.search}`
  return { href: part.href, host: url.hostname.replace(/^www\./, ''), path: path.length > 48 ? `${path.slice(0, 47)}…` : path }
}