import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Mail } from 'lucide-react'
import { AppShell } from '../components/layout'
import { Alert, Button, CodeInput } from '../components/ui'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import { usePrefs } from '../lib/prefs'

export default function VerifyEmail() {
  const { t, describeError } = usePrefs()
  const { user, reloadUser } = useAuth()
  const navigate = useNavigate()
  const avatarFailed = Boolean(useLocation().state?.avatarFailed)

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [cooldown, setCooldown] = useState(30) // a code was just sent: wait a little before resending

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  if (user?.email_verified && !done) return <Navigate to="/" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (code.length < 6) {
      setError(t('validation.code'))
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/verify-email', { code })
      setDone(true)
      await reloadUser()
    } catch (err) {
      setError(describeError(err))
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setError('')
    setInfo('')
    try {
      await api.post('/auth/resend-verification')
      setInfo(t('verify.resent'))
      setCode('')
      setCooldown(60)
    } catch (err) {
      setError(describeError(err))
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant bg-surface-lowest p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_6px_16px_-4px_rgba(13,92,58,0.08)] md:p-8">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-primary-container" />

          {done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="size-14 text-primary" aria-hidden="true" />
              <h1 className="text-headline-md text-on-surface">{t('verify.done')}</h1>
              <p className="text-body-md text-on-surface-variant">{t('verify.doneText')}</p>
              <Button onClick={() => navigate('/', { replace: true })}>{t('verify.continue')}</Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed">
                  <Mail className="size-7" aria-hidden="true" />
                </div>
                <h1 className="text-headline-md text-on-surface">{t('verify.title')}</h1>
                <p className="text-body-md text-on-surface-variant">
                  {t('verify.intro')} <strong className="break-all text-on-surface">{user?.email}</strong>
                </p>
              </div>
              {avatarFailed && <Alert kind="info">{t('avatar.failedNotice')}</Alert>}
              {error && <Alert kind="error">{error}</Alert>}
              {info && <Alert kind="success">{info}</Alert>}

              <div className="flex justify-center">
                <CodeInput value={code} onChange={setCode} label={t('recovery.code')} autoFocus />
              </div>

              <Button type="submit" loading={loading} className="w-full">
                {t('verify.submit')}
              </Button>

              <div className="flex items-center justify-between gap-2">
                <Button type="button" variant="ghost" onClick={resend} disabled={cooldown > 0}>
                  {cooldown > 0 ? t('verify.resendIn', { s: cooldown }) : t('verify.resend')}
                </Button>
                <Link to="/" className="px-3 font-display text-label-lg text-on-surface-variant hover:text-on-surface">
                  {t('verify.later')}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  )
}