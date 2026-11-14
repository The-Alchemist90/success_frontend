import { Check } from 'lucide-react'
import { usePrefs } from '../lib/prefs'

export function LevelPicker({ value, onChange }) {
  const { t } = usePrefs()
  return (
    <fieldset>
      <legend className="mb-1.5 font-display text-label-md text-on-surface">{t('register.level')} *</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name="level"
              value={n}
              checked={value === String(n)}
              onChange={(e) => onChange(e.target.value)}
              aria-label={t(`register.levels.${n}`)}
              className="peer sr-only"
            />
            <span className="flex flex-col items-center gap-0.5 rounded-xl border border-outline-variant bg-surface-lowest px-2 py-3 text-center text-on-surface transition-all hover:border-primary-container peer-checked:border-primary-container peer-checked:bg-primary-container peer-checked:text-white peer-checked:shadow-md peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-container">
              <span className="font-display text-title-sm font-bold">{t(`register.levelShort.${n}`)}</span>
              <span className="text-label-sm uppercase opacity-80">{t(`register.levelName.${n}`)}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** Live checklist under the password field. */
export function PasswordRules({ password }) {
  const { t } = usePrefs()
  const rules = [
    { ok: password.length >= 8, label: t('register.ruleMin') },
    { ok: /[A-Za-z]/.test(password), label: t('register.ruleLetter') },
    { ok: /\d/.test(password), label: t('register.ruleDigit') },
  ]
  return (
    <ul className="grid gap-1.5 sm:grid-cols-3" aria-label={t('register.passwordHint')}>
      {rules.map(({ ok, label }) => (
        <li key={label} className={`flex items-center gap-2 text-body-sm ${ok ? 'text-on-surface' : 'text-on-surface-variant'}`}>
          <span
            className={`flex size-5 items-center justify-center rounded-full transition-colors ${
              ok ? 'bg-primary-container text-white' : 'bg-surface-high text-outline'
            }`}
          >
            <Check className="size-3" aria-hidden="true" />
          </span>
          {label}
        </li>
      ))}
    </ul>
  )
}

/** Circular progress with the percentage in the middle. */
export function ProgressRing({ percent }) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative size-[72px] shrink-0">
      <svg viewBox="0 0 72 72" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="7" className="text-surface-high" />
        <circle
          cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className="text-primary-container transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-title-sm font-bold text-on-surface">
        {percent}%
      </span>
    </div>
  )
}