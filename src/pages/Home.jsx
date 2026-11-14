import { Link } from 'react-router-dom'
import { BadgeCheck, BookOpen, MailWarning, Users, UsersRound } from 'lucide-react'
import AvatarEditor from '../components/AvatarEditor'
import StudentCard from '../components/StudentCard'
import { useAuth } from '../auth/AuthContext'
import { usePrefs } from '../lib/prefs'

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-outline-variant py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-body-sm text-on-surface-variant">{label}</dt>
      <dd className="font-display text-label-lg text-on-surface sm:text-right">{children}</dd>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { t } = usePrefs()
  if (!user) return null

  return (
       <>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 md:px-6 md:py-12">
        <div className="animate-fade-up">
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
            {t('home.welcome', { name: user.first_name })}
          </h1>
          <p className="text-body-md text-on-surface-variant">{t('home.subtitle')}</p>
        </div>

        {!user.email_verified && (
          <div className="flex flex-col gap-3 rounded-2xl bg-tertiary-fixed p-4 text-on-tertiary-fixed sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-body-sm">
              <MailWarning className="size-5 shrink-0" aria-hidden="true" />
              {t('home.verifyBanner')}
            </p>
            <Link
              to="/verify-email"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary-container px-4 font-display text-label-lg text-white hover:bg-primary-hover"
            >
              {t('home.verifyCta')}
            </Link>
          </div>
        )}

        <section className="animate-fade-up grid gap-5 rounded-3xl border border-outline-variant/70 bg-surface-lowest p-5 shadow-[0_12px_32px_-12px_rgba(13,92,58,0.14)] md:grid-cols-2 md:p-7">
          <div className="flex flex-col justify-center gap-4">
            <h2 className="text-headline-sm text-on-surface">{t('home.cardTitle')}</h2>
            <AvatarEditor />
          </div>
          <StudentCard
            firstName={user.first_name}
            lastName={user.last_name}
            university={user.university || ''}
            faculty={user.faculty || ''}
            level={user.academic_level}
            specialty={user.specialty || ''}
            photoUrl={user.profile_pic_url}
            matricule={user.matricule}
            matriculeIsFinal
          />
        </section>

        <section className="rounded-2xl border border-outline-variant bg-surface-lowest p-5 md:p-7">
          <h2 className="mb-2 text-headline-sm text-on-surface">{t('home.profile')}</h2>
          <dl>
            <Row label={t('home.matricule')}>{user.matricule}</Row>
            <Row label={t('home.email')}>
              <span className="break-all">{user.email}</span>{' '}
              {user.email_verified ? (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2 py-0.5 text-label-md text-on-primary-fixed">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  {t('home.verified')}
                </span>
              ) : (
                <span className="ml-1 rounded-full bg-tertiary-fixed px-2 py-0.5 text-label-md text-on-tertiary-fixed">
                  {t('home.notVerified')}
                </span>
              )}
            </Row>
            <Row label={t('home.level')}>{t(`register.levels.${user.academic_level}`)}</Row>
            <Row label={t('home.university')}>{user.university}</Row>
            {user.faculty && <Row label={t('home.faculty')}>{user.faculty}</Row>}
            {user.specialty && <Row label={t('home.specialty')}>{user.specialty}</Row>}
          </dl>
        </section>

        <section className="rounded-2xl border border-dashed border-outline-variant p-5 md:p-7">
          <h2 className="mb-3 text-title-md text-on-surface-variant">{t('home.soonTitle')}</h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {[
              [BookOpen, t('home.soon1')],
              [Users, t('home.soon2')],
              [UsersRound, t('home.soon3')],
            ].map(([Icon, label]) => (
              <li key={label} className="flex items-center gap-3 rounded-xl bg-surface-low p-3 text-body-sm text-on-surface-variant">
                <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}