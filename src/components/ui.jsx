import { useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Info,
  Loader2,
  Moon,
  Sun,
} from 'lucide-react'
import { usePrefs } from '../lib/prefs'
import { passwordStrength } from '../lib/validators'

export function Spinner({ className = 'size-4' }) {
  return <Loader2 className={`${className} animate-spin`} aria-hidden="true" />
}

export function Logo() {
  const { t } = usePrefs()
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary-container text-white shadow-sm">
        <GraduationCap className="size-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-title-md leading-tight tracking-tight text-primary">
          Success <span className="text-secondary">·</span> Succès
        </span>
        <span className="font-display text-label-sm uppercase tracking-wider text-on-surface-variant">
          {t('brand.tagline')}
        </span>
      </div>
    </div>
  )
}

export function LangToggle() {
  const { lang, setLang } = usePrefs()
  const base = 'rounded-full px-2.5 py-1 font-display text-label-sm uppercase transition-colors'
  return (
    <div className="flex items-center rounded-full bg-surface-container p-0.5" role="group" aria-label="Language">
      {['fr', 'en'].map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`${base} ${
            lang === code
              ? 'bg-primary-container text-white shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  )
}

export function ThemeToggle() {
  const { theme, toggleTheme, t } = usePrefs()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t('common.toggleTheme')}
      className="flex size-9 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-high hover:text-on-surface"
    >
      {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}

const buttonBase =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 font-display text-label-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
const buttonVariants = {
  primary: 'bg-primary-container text-white shadow-sm hover:bg-primary-hover',
  ghost: 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  outline: 'border border-outline-variant text-on-surface hover:bg-surface-container',
}

export function Button({ variant = 'primary', loading = false, className = '', children, ...props }) {
  return (
    <button
      className={`${buttonBase} ${buttonVariants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

const alertStyles = {
  error: { box: 'bg-error-container text-on-error-container', Icon: AlertCircle },
  success: { box: 'bg-primary-fixed text-on-primary-fixed', Icon: CheckCircle2 },
  info: { box: 'bg-tertiary-fixed text-on-tertiary-fixed', Icon: Info },
}

export function Alert({ kind = 'error', children, ...props }) {
  const { box, Icon } = alertStyles[kind]
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl px-4 py-3 text-body-sm ${box}`}
      {...props}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}

export function Field({ id, label, hint, error, optional, children }) {
  const { t } = usePrefs()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label-md text-on-surface">
        {label}
        {optional && <span className="ml-1 font-body text-on-surface-variant">({t('common.optional')})</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-body-sm text-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-body-sm text-on-surface-variant">{hint}</p>
      )}
    </div>
  )
}

const inputBase =
  'h-11 w-full rounded-lg border bg-surface-low px-3.5 text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:bg-surface-lowest focus:border-primary-container'

export function TextInput({ icon: Icon, invalid = false, className = '', ...props }) {
  return (
    <div className="relative flex items-center">
      {Icon && <Icon className="pointer-events-none absolute left-3.5 size-5 text-on-surface-variant" aria-hidden="true" />}
      <input
        aria-invalid={invalid || undefined}
        className={`${inputBase} ${Icon ? 'pl-11' : ''} ${invalid ? 'border-error' : 'border-transparent'} ${className}`}
        {...props}
      />
    </div>
  )
}

export function PasswordInput({ icon: Icon, invalid = false, ...props }) {
  const { t } = usePrefs()
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative flex items-center">
      {Icon && <Icon className="pointer-events-none absolute left-3.5 size-5 text-on-surface-variant" aria-hidden="true" />}
      <input
        type={visible ? 'text' : 'password'}
        aria-invalid={invalid || undefined}
        className={`${inputBase} pr-11 ${Icon ? 'pl-11' : ''} ${invalid ? 'border-error' : 'border-transparent'}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
        className="absolute right-2 flex size-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
      >
        {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  )
}

export function StrengthMeter({ password }) {
  const { t } = usePrefs()
  if (!password) return null
  const level = passwordStrength(password)
  const colors = ['bg-error', 'bg-error', 'bg-secondary', 'bg-primary-container', 'bg-primary-container']
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < Math.max(level, 1) ? colors[level] : 'bg-surface-high'}`} />
        ))}
      </div>
      <span className="text-label-md text-on-surface-variant">{t('register.strength')[level]}</span>
    </div>
  )
}

/** Six boxes for a 6-digit code. Supports typing, backspace, arrow keys and pasting the whole code. */
export function CodeInput({ value, onChange, label, disabled = false, autoFocus = false }) {
  const refs = useRef([])
  const focusBox = (i) => refs.current[Math.max(0, Math.min(5, i))]?.focus()

  function handleInput(i, event) {
    const digit = event.target.value.replace(/\D/g, '').slice(-1)
    if (!digit) return
    const pos = Math.min(i, value.length) // digits are always filled from left to right
    onChange((value.slice(0, pos) + digit + value.slice(pos + 1)).slice(0, 6))
    focusBox(pos + 1)
  }

  function handleKeyDown(i, event) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      if (!value.length) return
      const pos = i < value.length ? i : value.length - 1
      onChange(value.slice(0, pos) + value.slice(pos + 1))
      focusBox(pos)
    } else if (event.key === 'ArrowLeft') {
      focusBox(i - 1)
    } else if (event.key === 'ArrowRight') {
      focusBox(i + 1)
    }
  }

  function handlePaste(event) {
    event.preventDefault()
    const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text) {
      onChange(text)
      focusBox(text.length)
    }
  }

  return (
    <div className="flex gap-2" role="group" aria-label={label}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={value[i] || ''}
          onChange={(e) => handleInput(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          aria-label={`${label} ${i + 1}`}
          className="h-12 w-11 rounded-lg border border-transparent bg-surface-low text-center font-display text-title-md text-on-surface outline-none transition-colors focus:border-primary-container focus:bg-surface-lowest"
        />
      ))}
    </div>
  )
}