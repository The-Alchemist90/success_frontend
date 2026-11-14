import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, BookOpen, CalendarDays, Check, ChevronDown, GraduationCap, Info, Lightbulb, Lock, Mail,
  ShieldCheck, Sparkles, Timer, User, Users, UsersRound, Zap,
} from 'lucide-react'
import { TopBar } from '../components/layout'
import { Alert, Button, Field, PasswordInput, StrengthMeter, TextInput } from '../components/ui'
import AvatarUploader from '../components/AvatarUploader'
import StudentCard from '../components/StudentCard'
import TiltCard from '../components/TiltCard'
import { LevelPicker, PasswordRules, ProgressRing } from '../components/formExtras'
import { useAuth } from '../auth/AuthContext'
import { uploadAvatar } from '../lib/avatar'
import { abbreviate } from '../lib/abbreviate'
import { academicYear, initialsOf, matriculePreview } from '../lib/format'
import { usePrefs } from '../lib/prefs'
import { EMAIL_RE, isValidPhone, normalizePhone, passwordProblems } from '../lib/validators'

// The Stitch design makes the photo mandatory. Set this to false to make it optional.
const PHOTO_REQUIRED = true

const UNIVERSITIES = [
  'Université de Yaoundé I',
  'Université de Yaoundé II',
  'École Nationale Supérieure Polytechnique de Yaoundé (ENSPY)',
  'Université Catholique d’Afrique Centrale (UCAC)',
  'Faculté de Médecine et des Sciences Biomédicales (FMSB)',
  'École Normale Supérieure de Yaoundé (ENS)',
]
const FACULTIES = [
  'Faculté des Sciences (FS)',
  'Faculté des Arts, Lettres et Sciences Humaines (FALSH)',
  'Faculté des Sciences Juridiques et Politiques (FSJP)',
  'Faculté des Sciences Économiques et de Gestion (FSEG)',
  'Génie Informatique et Télécommunications',
  'Sciences Biomédicales et Santé',
]

const EMPTY = {
  photo: null,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthdate: '',
  university: '',
  faculty: '',
  level: '1',
  specialty: '',
  password: '',
  confirm: '',
  charter: false,
}

// the order in which errors are shown / focused
const FIELD_ORDER = ['photo', 'firstName', 'lastName', 'email', 'phone', 'birthdate', 'university', 'password', 'confirm', 'charter']
const FIELD_IDS = { photo: 'avatar' }

function SectionCard({ id, number, Icon, title, subtitle, delay = 0, children }) {
  return (
    <section
      id={id}
      style={{ animationDelay: `${delay}ms` }}
      className="animate-fade-up relative scroll-mt-20 overflow-hidden rounded-3xl border border-outline-variant/70 bg-surface-lowest p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(13,92,58,0.14)] md:p-8"
    >
      <Icon aria-hidden="true" className="pointer-events-none absolute -right-3 -top-3 size-28 text-primary/10" />
      <div className="relative mb-6 flex items-center gap-4">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-primary-container to-primary font-display text-title-md font-bold text-white shadow-md">
          {number}
        </span>
        <div>
          <h2 className="text-headline-sm text-on-surface">{title}</h2>
          <p className="text-body-sm text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <div className="relative grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  )
}

function Tip({ children }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-secondary-fixed/50 p-4 md:col-span-2">
      <Lightbulb className="mt-0.5 size-5 shrink-0 text-secondary" aria-hidden="true" />
      <p className="text-body-sm text-on-secondary-fixed">{children}</p>
    </div>
  )
}

function StepPills({ labels, done, onJump }) {
  return (
    <nav aria-label="Progress" className="z-20 border-b border-outline-variant/50 bg-surface/80 backdrop-blur-xl lg:sticky lg:top-0">
      <div className="mx-auto flex max-w-3xl items-center gap-2 overflow-x-auto px-4 py-2.5 md:px-8">
        {labels.map((label, i) => (
          <Fragment key={label}>
            <a
              href={`#section-${i + 1}`}
              onClick={(e) => {
                e.preventDefault()
                onJump(`section-${i + 1}`)
              }}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 font-display text-label-lg transition-colors ${
                done[i]
                  ? 'border-primary-container bg-primary-fixed text-on-primary-fixed'
                  : 'border-outline-variant bg-surface-lowest text-on-surface-variant hover:border-primary-container'
              }`}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full text-label-md ${
                  done[i] ? 'bg-primary-container text-white' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {done[i] ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
              </span>
              {label}
            </a>
            {i < labels.length - 1 && (
              <span aria-hidden="true" className={`h-px w-6 shrink-0 sm:w-12 ${done[i] ? 'bg-primary-container' : 'bg-outline-variant'}`} />
            )}
          </Fragment>
        ))}
      </div>
    </nav>
  )
}

/** Phones: a slim card summary stays under the top bar; tap to see the full card. */
function MiniCard({ cardProps, percent, photoUrl }) {
  const { t } = usePrefs()
  const [open, setOpen] = useState(false)
  const name = `${cardProps.firstName} ${cardProps.lastName}`.trim()
  const summary = [abbreviate(cardProps.university), t('card.level', { n: Number(cardProps.level) })].filter(Boolean).join(' · ')
  return (
    <div className="sticky top-16 z-30 border-b border-outline-variant/60 bg-surface/90 backdrop-blur-xl lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="size-10 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary-container to-primary font-display font-bold text-white">
            {name ? initialsOf(cardProps.firstName, cardProps.lastName) : '?'}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-label-lg text-on-surface">{name || t('card.namePlaceholder')}</span>
          <span className="block truncate text-label-md text-on-surface-variant">{summary}</span>
        </span>
        <span className="rounded-full bg-primary-fixed px-2 py-0.5 font-display text-label-md text-on-primary-fixed">{percent}%</span>
        <ChevronDown className={`size-5 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        <span className="sr-only">{open ? t('register.hideCard') : t('register.showCard')}</span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <StudentCard {...cardProps} photoUrl={photoUrl} />
        </div>
      )}
    </div>
  )
}

export default function Register() {
  const { t, lang, describeError } = usePrefs()
  const { status, register, updateUser } = useAuth()
  const navigate = useNavigate()
  const submitting = useRef(false)
  const alertRef = useRef(null)

  const [values, setValues] = useState(EMPTY)
  const [tried, setTried] = useState(false)
  const [phase, setPhase] = useState('idle') // 'idle' | 'creating' | 'uploading'
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')

  // A visitor who is already logged in has nothing to do here.
  useEffect(() => {
    if (status === 'authenticated' && !submitting.current) navigate('/', { replace: true })
  }, [status, navigate])

  useEffect(() => {
    if (error) alertRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  }, [error])

  const set = (name) => (e) =>
    setValues((v) => ({ ...v, [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  function validate(v) {
    const errors = {}
    if (PHOTO_REQUIRED && !v.photo) errors.photo = t('avatar.errors.required')
    if (!v.firstName.trim()) errors.firstName = t('validation.required')
    if (!v.lastName.trim()) errors.lastName = t('validation.required')
    if (!EMAIL_RE.test(v.email.trim())) errors.email = t('validation.email')
    if (!isValidPhone(v.phone)) errors.phone = t('validation.phone')
    if (v.birthdate && !(v.birthdate >= '1940-01-01' && v.birthdate <= new Date().toISOString().slice(0, 10))) {
      errors.birthdate = t('validation.birthdate')
    }
    if (v.university.trim().length < 2) errors.university = t('validation.required')
    const problems = passwordProblems(v.password)
    if (problems.length) errors.password = t(`validation.${problems[0]}`)
    if (v.confirm !== v.password) errors.confirm = t('validation.mismatch')
    if (!v.charter) errors.charter = t('validation.charter')
    return errors
  }
  const errors = tried ? validate(values) : {}

  // Everything that is required, to draw the progress ring and the bar
  const checks = [
    !PHOTO_REQUIRED || !!values.photo,
    !!values.firstName.trim(),
    !!values.lastName.trim(),
    EMAIL_RE.test(values.email.trim()),
    values.university.trim().length >= 2,
    passwordProblems(values.password).length === 0,
    values.confirm.length > 0 && values.confirm === values.password,
    values.charter,
  ]
  const doneCount = checks.filter(Boolean).length
  const percent = Math.round((doneCount / checks.length) * 100)
  const remaining = checks.length - doneCount

  // which of the three sections are complete (drives the pills)
  const done = [
    checks[0] && checks[1] && checks[2] && checks[3] && isValidPhone(values.phone),
    checks[4],
    checks[5] && checks[6] && checks[7],
  ]

  function jumpTo(id) {
    document.getElementById(id)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  function focusField(name) {
    const el = document.getElementById(FIELD_IDS[name] || name)
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    el?.focus?.({ preventScroll: true })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setTried(true)
    setError('')
    const found = validate(values)
    const first = FIELD_ORDER.find((name) => found[name])
    if (first) {
      focusField(first)
      return
    }

    const payload = {
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      phone: normalizePhone(values.phone),
      birthdate: values.birthdate || null,
      university: values.university.trim(),
      faculty: values.faculty.trim() || null,
      specialty: values.specialty.trim() || null,
      academic_level: Number(values.level),
      preferred_language: lang,
      charter_accepted: true,
    }

    submitting.current = true
    setPhase('creating')
    try {
      await register(payload) // creates the account, then logs in
    } catch (err) {
      submitting.current = false
      setPhase('idle')
      setError(describeError(err))
      return
    }

    // The account exists. A failed photo must NOT cancel it: the student can retry from the home page.
    let avatarFailed = false
    if (values.photo) {
      setPhase('uploading')
      setProgress(0)
      try {
        updateUser(await uploadAvatar(values.photo.blob, setProgress))
      } catch {
        avatarFailed = true
      }
    }
    navigate('/verify-email', { replace: true, state: { avatarFailed } })
  }

  const busy = phase !== 'idle'
  const cardProps = {
    firstName: values.firstName,
    lastName: values.lastName,
    university: values.university,
    faculty: values.faculty,
    level: values.level,
    specialty: values.specialty,
    matricule: matriculePreview(values.university),
  }
  const photoUrl = values.photo?.previewUrl

  const benefits = [
    { Icon: Users, title: t('register.benefit1Title'), text: t('register.benefit1Text') },
    { Icon: Timer, title: t('register.benefit2Title'), text: t('register.benefit2Text') },
    { Icon: UsersRound, title: t('register.benefit3Title'), text: t('register.benefit3Text') },
  ]
  const unlocks = [
    { Icon: BookOpen, text: t('register.unlock1') },
    { Icon: Users, text: t('register.unlock2') },
    { Icon: UsersRound, text: t('register.unlock3') },
    { Icon: Zap, text: t('register.unlock4') },
  ]
  const trust = [
    { Icon: Lock, text: t('register.trust1') },
    { Icon: ShieldCheck, text: t('register.trust2') },
    { Icon: Info, text: t('register.trust3') },
  ]

  return (
    // Computer: the page is exactly one screen tall. Only the form (left) scrolls; the card (right) stays in view.
    // Phone: the page scrolls normally and a slim card summary stays under the top bar.
    <div className="flex min-h-dvh flex-col bg-surface lg:h-dvh lg:overflow-hidden">
      <TopBar className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl lg:static" />
      <MiniCard cardProps={cardProps} percent={percent} photoUrl={photoUrl} />

      <div className="relative isolate flex-1 overflow-x-clip lg:grid lg:min-h-0 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)]">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/4 -z-10 size-96 rounded-full bg-primary-fixed/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-10 -left-20 -z-10 size-80 rounded-full bg-secondary-fixed/30 blur-3xl" />

        <form onSubmit={onSubmit} noValidate className="scroll-thin relative flex flex-col lg:col-span-8 lg:h-full lg:overflow-y-auto">
          <StepPills labels={t('register.steps')} done={done} onJump={jumpTo} />

          <div className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 md:px-8">
            <header className="animate-fade-up mb-4 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-1 font-display text-label-sm uppercase tracking-wider text-white shadow-sm">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  {t('register.badgeYear', { year: academicYear() })}
                </span>
                <span className="rounded-full bg-surface-high px-2.5 py-1 font-display text-label-md text-on-surface-variant">
                  {t('register.badgeLmd')}
                </span>
                <span className="rounded-full bg-secondary-fixed px-2.5 py-1 font-display text-label-md font-bold text-on-secondary-fixed">
                  {t('register.badgeFree')}
                </span>
              </div>
              <h1 className="text-headline-lg-mobile text-primary md:text-headline-lg xl:text-display-hero">
                {t('register.title')}
                <span className="mt-1 block text-title-md font-normal text-secondary">{t('register.titleAlt')}</span>
              </h1>
              <p className="max-w-2xl text-body-md text-on-surface-variant">{t('register.subtitle')}</p>

              <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
                {benefits.map(({ Icon, title, text }) => (
                  <li key={title} className="flex min-w-[16.5rem] snap-start items-start gap-3 rounded-2xl border border-outline-variant/70 bg-surface-lowest/80 p-4 backdrop-blur sm:min-w-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-display text-label-lg font-bold text-on-surface">{title}</span>
                      <span className="block text-body-sm text-on-surface-variant">{text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </header>

            <div className="flex flex-col gap-6 pb-8">
              <div ref={alertRef}>{error && <Alert kind="error">{error}</Alert>}</div>

              <SectionCard id="section-1" number="1" Icon={User} title={t('register.s1')} subtitle={t('register.s1Sub')}>
                <div className="md:col-span-2">
                  <AvatarUploader
                    value={values.photo}
                    onChange={(photo) => setValues((v) => ({ ...v, photo }))}
                    error={errors.photo}
                    required={PHOTO_REQUIRED}
                    progress={phase === 'uploading' ? progress : null}
                    disabled={busy}
                  />
                </div>
                <Field id="firstName" label={`${t('register.firstName')} *`} error={errors.firstName}>
                  <TextInput id="firstName" icon={User} autoComplete="given-name" maxLength={100}
                    value={values.firstName} invalid={!!errors.firstName} onChange={set('firstName')} />
                </Field>
                <Field id="lastName" label={`${t('register.lastName')} *`} hint={t('register.nameHint')} error={errors.lastName}>
                  <TextInput id="lastName" icon={User} autoComplete="family-name" maxLength={100}
                    value={values.lastName} invalid={!!errors.lastName} onChange={set('lastName')} />
                </Field>
                <div className="md:col-span-2">
                  <Field id="email" label={`${t('register.email')} *`} hint={t('register.emailHint')} error={errors.email}>
                    <TextInput id="email" type="email" icon={Mail} autoComplete="email" maxLength={150}
                      placeholder="etudiant@gmail.com" value={values.email} invalid={!!errors.email} onChange={set('email')} />
                  </Field>
                </div>
                <Field id="phone" label={t('register.phone')} optional hint={t('register.phoneHint')} error={errors.phone}>
                  <div className="flex gap-2">
                    <span className="flex h-11 items-center rounded-lg bg-surface-container px-3 font-display text-label-lg text-on-surface-variant">
                      +237
                    </span>
                    <TextInput id="phone" type="tel" autoComplete="tel-national" placeholder="699 12 34 56"
                      value={values.phone} invalid={!!errors.phone} onChange={set('phone')} />
                  </div>
                </Field>
                <Field id="birthdate" label={t('register.birthdate')} optional error={errors.birthdate}>
                  <TextInput id="birthdate" type="date" icon={CalendarDays} autoComplete="bday"
                    value={values.birthdate} invalid={!!errors.birthdate} onChange={set('birthdate')} />
                </Field>
                <div className="flex items-start gap-3 rounded-2xl bg-primary-fixed/60 p-4 md:col-span-2">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-display text-label-lg text-on-surface">{t('register.privacyTitle')}</p>
                    <p className="text-body-sm text-on-surface-variant">{t('register.privacyText')}</p>
                  </div>
                </div>
                <Tip>{t('register.tip1')}</Tip>
              </SectionCard>

              <SectionCard id="section-2" number="2" Icon={GraduationCap} title={t('register.s2')} subtitle={t('register.s2Sub')} delay={80}>
                <div className="md:col-span-2">
                  <Field id="university" label={`${t('register.university')} *`} error={errors.university}>
                    <TextInput id="university" list="universities" autoComplete="organization" maxLength={150}
                      placeholder={t('register.universityPlaceholder')} value={values.university}
                      invalid={!!errors.university} onChange={set('university')} />
                    <datalist id="universities">
                      {UNIVERSITIES.map((name) => <option key={name} value={name} />)}
                    </datalist>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field id="faculty" label={t('register.faculty')} optional>
                    <TextInput id="faculty" list="faculties" maxLength={150}
                      placeholder={t('register.facultyPlaceholder')} value={values.faculty} onChange={set('faculty')} />
                    <datalist id="faculties">
                      {FACULTIES.map((name) => <option key={name} value={name} />)}
                    </datalist>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <LevelPicker value={values.level} onChange={(level) => setValues((v) => ({ ...v, level }))} />
                </div>
                <div className="md:col-span-2">
                  <Field id="specialty" label={t('register.specialty')} optional>
                    <TextInput id="specialty" icon={BookOpen} maxLength={150}
                      placeholder={t('register.specialtyPlaceholder')} value={values.specialty} onChange={set('specialty')} />
                  </Field>
                </div>
                <Tip>{t('register.tip2')}</Tip>
              </SectionCard>

              <SectionCard id="section-3" number="3" Icon={ShieldCheck} title={t('register.s3')} subtitle={t('register.s3Sub')} delay={160}>
                <div className="md:col-span-2">
                  <Field id="password" label={`${t('register.password')} *`} error={errors.password}>
                    <PasswordInput id="password" icon={Lock} autoComplete="new-password"
                      value={values.password} invalid={!!errors.password} onChange={set('password')} />
                  </Field>
                  <div className="mt-3 flex flex-col gap-3">
                    <PasswordRules password={values.password} />
                    <StrengthMeter password={values.password} />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Field id="confirm" label={`${t('register.confirm')} *`} error={errors.confirm}>
                    <PasswordInput id="confirm" icon={Lock} autoComplete="new-password"
                      value={values.confirm} invalid={!!errors.confirm} onChange={set('confirm')} />
                  </Field>
                </div>
                <Tip>{t('register.tip3')}</Tip>
                <div className="md:col-span-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-surface-low p-4">
                    <input id="charter" type="checkbox" checked={values.charter} onChange={set('charter')}
                      className="mt-0.5 size-5 shrink-0 rounded-md accent-primary-container" />
                    <span className="font-body text-body-sm text-on-surface-variant">{t('register.charter')}</span>
                  </label>
                  {errors.charter && <p className="mt-1.5 text-body-sm text-error" role="alert">{errors.charter}</p>}
                </div>
              </SectionCard>

              <ul className="grid gap-3 sm:grid-cols-3">
                {trust.map(({ Icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5 rounded-2xl bg-surface-low p-4 text-body-sm text-on-surface-variant">
                    <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>

              <p className="pb-2 text-center text-body-sm text-on-surface-variant">
                {t('register.haveAccount')}{' '}
                <Link to="/login" className="font-display text-label-lg text-primary hover:underline">
                  {t('register.login')}
                </Link>
              </p>
            </div>
          </div>

          {/* always-visible action bar */}
          <div className="sticky bottom-0 z-20 border-t border-outline-variant/60 bg-surface/90 px-4 py-3 backdrop-blur-xl md:px-8">
            <div className="mx-auto flex max-w-3xl items-center gap-4">
              <div className="hidden min-w-0 flex-1 sm:block">
                <div className="mb-1 flex justify-between text-label-md text-on-surface-variant">
                  <span>{t('register.barLabel', { done: doneCount, total: checks.length })}</span>
                  <span>{percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-high">
                  <div className="h-full rounded-full bg-linear-to-r from-primary-container to-[#22c55e] transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
              <Button type="submit" loading={busy} className="h-12 w-full text-title-sm shadow-lg sm:w-auto sm:min-w-64">
                {phase === 'creating' ? t('register.creating') : phase === 'uploading' ? t('register.uploading') : t('register.submit')}
                {!busy && <ArrowRight className="size-5" aria-hidden="true" />}
              </Button>
            </div>
          </div>
        </form>

        <aside className="relative hidden flex-col gap-4 overflow-hidden border-l border-outline-variant/60 bg-linear-to-b from-primary-fixed/50 via-surface to-surface px-6 py-5 lg:col-span-4 lg:flex xl:px-8">
          <div aria-hidden="true" className="pattern-diamonds-dark pointer-events-none absolute inset-0" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-1/3 size-72 rounded-full bg-secondary-fixed/40 blur-3xl" />

          <div className="relative flex items-center justify-between">
            <span className="font-display text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
              {t('register.previewTitle')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-2 py-0.5 text-label-md text-on-primary-fixed">
              <span className="size-1.5 animate-pulse rounded-full bg-primary-container" />
              {t('register.previewLive')}
            </span>
          </div>

          <TiltCard className="relative">
            <StudentCard {...cardProps} photoUrl={photoUrl} />
          </TiltCard>

          <div className="relative flex items-center gap-4 rounded-2xl border border-outline-variant/70 bg-surface-lowest/90 p-4 backdrop-blur">
            <ProgressRing percent={percent} />
            <div className="min-w-0">
              <p className="font-display text-title-sm font-bold text-on-surface">{t('register.progressTitle')}</p>
              <p className="text-body-sm text-on-surface-variant">
                {remaining === 0 ? t('register.allSet') : t('register.remaining', { n: remaining })}
              </p>
            </div>
          </div>

          <div className="relative rounded-2xl border border-outline-variant/70 bg-surface-lowest/90 p-4 backdrop-blur [@media(max-height:700px)]:hidden">
            <p className="mb-3 font-display text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
              {t('register.unlockTitle')}
            </p>
            <ul className="flex flex-col gap-2">
              {unlocks.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-body-sm text-on-surface">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative flex items-start gap-2 text-body-sm text-on-surface-variant [@media(max-height:800px)]:hidden">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            {t('register.previewInfo')}
          </p>
        </aside>
      </div>
    </div>
  )
}