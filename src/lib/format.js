const STOP_WORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'd', 'l', 'of', 'the', 'et', 'and', 'a'])

/** "Université de Yaoundé I" -> "UYI" (same rule as the server, only used for the live preview). */
export function universityCode(university) {
  const ascii = (university || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const words = ascii.match(/[A-Za-z0-9]+/g) || []
  const letters = words
    .filter((w) => !STOP_WORDS.has(w.toLowerCase()))
    .map((w) => w[0].toUpperCase())
    .join('')
  return letters.slice(0, 3).padEnd(3, 'X')
}

/** "26SUYI-····": what the student's matricule will start with. */
export function matriculePreview(university, now = new Date()) {
  const year = String(now.getFullYear()).slice(-2)
  const code = (university || '').trim() ? universityCode(university) : '···'
  return `${year}S${code}-····`
}

/** "2026–2027" (the academic year starts around September). */
export function academicYear(now = new Date()) {
  const year = now.getFullYear()
  const start = now.getMonth() >= 7 ? year : year - 1
  return `${start}–${start + 1}`
}

export function initialsOf(firstName = '', lastName = '') {
  const letters = `${firstName.trim()[0] || ''}${lastName.trim()[0] || ''}`.toUpperCase()
  return letters || '?'
}