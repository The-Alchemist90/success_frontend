const STEPS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

/** "now", "5 min ago", "yesterday", "3 wk ago" in the current language. */
export function timeAgo(iso, lang = 'en') {
  const seconds = Math.min(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000))
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto', style: 'short' })
  if (-seconds < 45) return rtf.format(0, 'second')
  for (const [unit, size] of STEPS) {
    if (-seconds >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return rtf.format(-1, 'minute')
}

export function fullDate(iso, lang = 'en') {
  return new Date(iso).toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' })
}