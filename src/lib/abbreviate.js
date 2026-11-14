
const STOP_WORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'd', 'l', 'et', 'en', 'au', 'aux', 'of', 'the', 'and', 'for', 'in', 'at', 'a'])
const ROMAN = { i: '1', ii: '2', iii: '3', iv: '4', v: '5' }


const KNOWN = {
  'software engineering': 'SWE',
  'genie logiciel': 'GL',
  'computer science': 'CS',
  'computer engineering': 'CE',
  'genie informatique': 'GI',
  'informatique': 'INFO',
  'information systems': 'IS',
  'systemes d information': 'SI',
  'information technology': 'IT',
  'data science': 'DS',
  'artificial intelligence': 'AI',
  'intelligence artificielle': 'IA',
  'cyber security': 'CYS',
  'cybersecurity': 'CYS',
  'cybersecurite': 'CYS',
  'electrical engineering': 'EE',
  'genie electrique': 'GE',
  'civil engineering': 'CIV',
  'genie civil': 'GC',
  'mechanical engineering': 'ME',
  'genie mecanique': 'GM',
  'mathematics': 'MATH',
  'mathematiques': 'MATH',
  'biochemistry': 'BCH',
  'biochimie': 'BCH',
}


function normalize(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}


function acronym(text, maxLetters) {
  const letters = []
  for (const word of normalize(text).split(' ').filter(Boolean)) {
    if (STOP_WORDS.has(word)) continue
    if (ROMAN[word] && letters.length > 0) letters.push(ROMAN[word])
    else letters.push(word[0].toUpperCase())
  }
  return letters.slice(0, maxLetters).join('')
}


export function abbreviate(text, { maxLetters = 5 } = {}) {
  const value = (text || '').trim()
  if (!value) return ''

  const inBrackets = value.match(/\(([A-Za-z0-9]{2,8})\)/)
  if (inBrackets) return inBrackets[1].toUpperCase()

  const known = KNOWN[normalize(value)]
  if (known) return known

  if (!/\s/.test(value)) {
    // one word: keep it if it is short ("Droit", "SWE"), otherwise its first 4 letters
    return value.length <= 9 ? value : value.slice(0, 4).toUpperCase()
  }

  const short = acronym(value, maxLetters)
  return short.length >= 2 ? short : value
}