import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Lock, Mail, ShieldCheck, X } from 'lucide-react'
import { Alert, Button, CodeInput, Field, PasswordInput, StrengthMeter, TextInput } from './ui'
import { api } from '../lib/api'
import { usePrefs } from '../lib/prefs'
import { EMAIL_RE, passwordProblems } from '../lib/validators'

/** Two-step password reset: (1) ask for a code by email, (2) enter the code + a new password. */
export default function RecoveryModal({ initialEmail = '', onClose, onDone }) {
  const { t, describeError } = usePrefs()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState(initialEmail.includes('@') ? initialEmail : '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [tried, setTried] = useState(false)
  const dialogRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    dialogRef.current?.querySelector('input')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const emailError = tried && !EMAIL_RE.test(email.trim()) ? t('validation.email') : ''
  const codeError = tried && code.length < 6 ? t('validation.code') : ''
  const passwordError = tried && passwordProblems(password)[0] ? t(`validation.${passwordProblems(password)[0]}`) : ''

  async function sendCode(e) {
    e?.preventDefault()
    setTried(true)
    setError('')
    if (!EMAIL_RE.test(email.trim())) return
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() }, { auth: false })
      setStep(2)
      setTried(false)
      setInfo(t('recovery.sent'))
    } catch (err) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword(e) {
    e.preventDefault()
    setTried(true)
    setError('')
    setInfo('')
    if (code.length < 6 || passwordProblems(password).length) return
    setLoading(true)
    try {
      await api.post(
        '/auth/reset-password',
        { email: email.trim().toLowerCase(), code, new_password: password },
        { auth: false },
      )
      onDone()
    } catch (err) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-title"
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface-lowest p-6 shadow-2xl md:p-8"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-primary-container" />
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
        >
          <X className="size-5" />
        </button>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
              <Lock className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-label-sm uppercase tracking-wider text-secondary">
                {step === 1 ? t('recovery.kicker') : t('recovery.step2')}
              </p>
              <h2 id="recovery-title" className="text-headline-sm text-on-surface">
                {step === 1 ? t('recovery.title') : t('recovery.step2Title')}
              </h2>
            </div>
          </div>

          {error && <Alert kind="error">{error}</Alert>}
          {info && <Alert kind="success">{info}</Alert>}

          {step === 1 ? (
            <form onSubmit={sendCode} noValidate className="flex flex-col gap-4">
              <p className="text-body-md text-on-surface-variant">{t('recovery.intro')}</p>
              <Field id="rec-email" label={t('recovery.email')} error={emailError}>
                <TextInput
                  id="rec-email"
                  type="email"
                  icon={Mail}
                  autoComplete="email"
                  value={email}
                  invalid={!!emailError}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <div className="flex items-start gap-2 rounded-lg bg-surface-low p-3 text-body-sm text-on-surface-variant">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <p>{t('recovery.note')}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" loading={loading}>
                  {t('recovery.send')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={resetPassword} noValidate className="flex flex-col gap-4">
              <p className="text-body-sm text-on-surface-variant">{t('recovery.step2Intro')}</p>
              <Field id="rec-code" label={t('recovery.code')} error={codeError}>
                <CodeInput value={code} onChange={setCode} label={t('recovery.code')} autoFocus />
              </Field>
              <Field id="rec-password" label={t('recovery.newPassword')} error={passwordError}>
                <PasswordInput
                  id="rec-password"
                  icon={Lock}
                  autoComplete="new-password"
                  value={password}
                  invalid={!!passwordError}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <StrengthMeter password={password} />
              <div className="flex items-center justify-between gap-2">
                <Button type="button" variant="ghost" onClick={sendCode} disabled={loading}>
                  {t('recovery.resend')}
                </Button>
                <Button type="submit" loading={loading}>
                  {t('recovery.submit')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}