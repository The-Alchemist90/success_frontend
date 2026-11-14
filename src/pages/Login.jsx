import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, GraduationCap, Lock, Mail } from 'lucide-react'
import { TopBar } from '../components/layout'
import { Alert, Button, Field, PasswordInput, TextInput } from '../components/ui'
import AuthHero from '../components/AuthHero'
import RecoveryModal from '../components/RecoveryModal'
import { useAuth } from '../auth/AuthContext'
import { usePrefs } from '../lib/prefs'

export default function Login() {
  const { t, describeError } = usePrefs()
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [tried, setTried] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [recoveryOpen, setRecoveryOpen] = useState(false)

  // Already logged in (or just logged in): leave this page.
  useEffect(() => {
    if (status === 'authenticated') navigate(from, { replace: true })
  }, [status, from, navigate])

  const idError = tried && !identifier.trim() ? t('validation.required') : ''
  const pwError = tried && !password ? t('validation.required') : ''

  async function onSubmit(e) {
    e.preventDefault()
    setTried(true)
    setError('')
    setNotice('')
    if (!identifier.trim() || !password) return
    setLoading(true)
    try {
      await login({ identifier, password, remember })
    } catch (err) {
      setError(describeError(err))
      setLoading(false)
    }
  }

  return (
    // The page itself never scrolls on a computer; only if the window is very short does the form area scroll.
    <div className="grid min-h-dvh bg-surface lg:h-dvh lg:grid-cols-[1.1fr_1fr] lg:overflow-hidden">
      <AuthHero />

      <div className="relative isolate flex min-h-dvh flex-col overflow-hidden lg:min-h-0">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 -z-10 size-96 rounded-full bg-primary-fixed/50 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 -z-10 size-80 rounded-full bg-secondary-fixed/40 blur-3xl" />
        <div aria-hidden="true" className="pattern-diamonds-dark pointer-events-none absolute inset-0 -z-10 opacity-60" />

        <TopBar logoClass="lg:invisible" />

        <main className="scroll-thin flex flex-1 overflow-y-auto px-4 pb-8 md:px-8 lg:min-h-0 lg:pb-6">
          <div className="animate-fade-up m-auto w-full max-w-md">
            <div className="relative overflow-hidden rounded-3xl border border-outline-variant/70 bg-surface-lowest/95 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_24px_48px_-16px_rgba(13,92,58,0.25)] backdrop-blur md:p-8 [@media(max-height:720px)]:!p-5">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-primary-container via-[#22c55e] to-secondary" />

              <div className="mb-5 flex flex-col gap-2.5">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1 font-display text-label-md text-on-primary-fixed">
                  <Lock className="size-3.5" aria-hidden="true" />
                  {t('login.badge')}
                </span>
                <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">{t('login.title')}</h1>
                <p className="text-body-md text-on-surface-variant [@media(max-height:690px)]:hidden">{t('login.subtitle')}</p>
              </div>

              <div className="flex flex-col gap-4">
                {notice && <Alert kind="success">{notice}</Alert>}
                {error && <Alert kind="error">{error}</Alert>}

                <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                  <Field id="identifier" label={t('login.identifier')} error={idError}>
                    <TextInput
                      id="identifier"
                      icon={Mail}
                      autoComplete="username"
                      placeholder={t('login.identifierPlaceholder')}
                      value={identifier}
                      invalid={!!idError}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </Field>
                  <Field id="password" label={t('login.password')} error={pwError}>
                    <PasswordInput
                      id="password"
                      icon={Lock}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      value={password}
                      invalid={!!pwError}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-body-sm text-on-surface-variant">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="size-5 rounded-md accent-primary-container"
                      />
                      {t('login.remember')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setRecoveryOpen(true)}
                      className="text-label-lg text-primary underline-offset-4 hover:underline"
                    >
                      {t('login.forgot')}
                    </button>
                  </div>

                  <Button type="submit" loading={loading} className="h-12 w-full text-title-sm shadow-lg">
                    {t('login.submit')}
                    {!loading && <ArrowRight className="size-5" aria-hidden="true" />}
                  </Button>
                </form>

                <div className="flex items-center gap-3 text-label-md text-on-surface-variant">
                  <span className="h-px flex-1 bg-outline-variant" />
                  {t('login.noAccount')}
                  <span className="h-px flex-1 bg-outline-variant" />
                </div>

                <Link
                  to="/register"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary-container font-display text-label-lg text-primary transition-colors hover:bg-primary-fixed"
                >
                  {t('login.createAccount')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <p className="mx-auto mt-4 max-w-sm text-center text-body-sm text-on-surface-variant [@media(max-height:700px)]:hidden">
              <GraduationCap className="mr-1.5 inline size-4 align-text-bottom text-primary" aria-hidden="true" />
              {t('login.freeNote')}
            </p>
          </div>
        </main>
      </div>

      {recoveryOpen && (
        <RecoveryModal
          initialEmail={identifier}
          onClose={() => setRecoveryOpen(false)}
          onDone={() => {
            setRecoveryOpen(false)
            setPassword('')
            setError('')
            setNotice(t('login.passwordChanged'))
          }}
        />
      )}
    </div>
  )
}