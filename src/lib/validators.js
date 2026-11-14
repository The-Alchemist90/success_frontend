export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/


export function passwordProblems(password) {
  const problems = []
  if (password.length < 8) problems.push('passwordMin')
  if (new TextEncoder().encode(password).length > 72) problems.push('passwordMax')
  if (!/[A-Za-z]/.test(password)) problems.push('passwordLetter')
  if (!/\d/.test(password)) problems.push('passwordDigit')
  return problems
}


export function passwordStrength(password) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++
  return Math.min(score, 4)
}


export function normalizePhone(raw) {
  const cleaned = (raw || '').replace(/[\s\-.()]/g, '')
  if (!cleaned) return null
  if (cleaned.startsWith('+')) return '+' + cleaned.slice(1).replace(/\D/g, '')
  const digits = cleaned.replace(/\D/g, '')
  if (digits.startsWith('237') && digits.length >= 11) return '+' + digits
  return '+237' + digits
}

export function isValidPhone(raw) {
  const phone = normalizePhone(raw)
  return phone === null || /^\+\d{8,15}$/.test(phone)
}