import { CheckCircle2, Lock, ShieldCheck, Timer, Users, Zap } from 'lucide-react'
import { Logo } from './ui'
import { usePrefs } from '../lib/prefs'


export default function AuthHero() {
  const { t } = usePrefs()
  const chips = [
    { Icon: Users, label: t('login.f1Title') },
    { Icon: ShieldCheck, label: t('login.f2Title') },
    { Icon: Zap, label: t('login.f3Title') },
  ]

  return (
    <aside className="relative hidden flex-col justify-between gap-6 overflow-hidden bg-linear-to-br from-[#002f1c] via-[#0d5c3a] to-[#15803d] px-10 py-8 text-white lg:flex xl:px-14">
      <div aria-hidden="true" className="pattern-diamonds-light absolute inset-0" />
      <div aria-hidden="true" className="absolute -left-24 top-1/4 size-96 rounded-full bg-[#a9f3c5]/20 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 right-0 size-[28rem] rounded-full bg-[#ff9b5e]/25 blur-3xl" />

      <div className="relative z-10">
        <Logo onDark />
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 font-display text-label-md ring-1 ring-white/20 backdrop-blur">
          <span className="size-1.5 animate-pulse rounded-full bg-[#a9f3c5]" />
          {t('login.heroKicker')}
        </span>
        <h2 className="font-display text-headline-lg font-bold xl:text-display-hero">{t('login.showcaseTitle')}</h2>
        <p className="max-w-lg text-body-lg text-white/80 [@media(max-height:720px)]:hidden">{t('login.showcaseText')}</p>
      </div>

      {/* floating "product preview" cards: purely decorative */}
      <div
        aria-hidden="true"
        className="relative z-10 h-64 w-full max-w-xl [@media(max-height:820px)]:h-60 [@media(max-height:660px)]:hidden"
      >
        <div className="animate-float absolute left-0 top-2 w-72 rounded-2xl bg-white/12 p-4 shadow-2xl ring-1 ring-white/25 backdrop-blur-md">
          <div className="flex items-center gap-2 text-label-md text-white/80">
            <span className="flex size-7 items-center justify-center rounded-lg bg-white/15">
              <Timer className="size-4" />
            </span>
            {t('scene.quizTitle')}
          </div>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-mono text-headline-lg font-bold tracking-wider">24:18</span>
            <span className="pb-1 text-label-sm uppercase text-white/60">{t('scene.quizTime')}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-3/5 rounded-full bg-[#a9f3c5]" />
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-black/20 px-2.5 py-1.5 text-label-md text-[#a9f3c5]">
            <Lock className="size-3.5" />
            {t('scene.lock')}
          </div>
        </div>

        <div className="animate-float-slow absolute right-0 top-14 w-[17rem] rounded-2xl bg-white/12 p-4 shadow-2xl ring-1 ring-white/25 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-linear-to-br from-[#ffb68a] to-[#ff7a3d] font-display font-bold text-white">
              M
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-title-sm font-bold">{t('scene.mentorTitle')}</p>
              <p className="truncate text-label-md text-white/70">{t('scene.mentorSub')}</p>
            </div>
            <CheckCircle2 className="ml-auto size-5 shrink-0 text-[#a9f3c5]" />
          </div>
        </div>

        <div className="animate-float absolute bottom-0 left-8 w-64 rounded-2xl bg-white/12 p-4 shadow-2xl ring-1 ring-white/25 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['from-[#ffd08a] to-[#f59e0b]', 'from-[#ffb68a] to-[#ea580c]', 'from-[#a9f3c5] to-[#22c55e]'].map((tone) => (
                <span key={tone} className={`size-8 rounded-full bg-linear-to-br ${tone} ring-2 ring-[#0d5c3a]`} />
              ))}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-title-sm font-bold">{t('scene.circleTitle')}</p>
              <p className="truncate text-label-md text-white/70">{t('scene.circleSub')}</p>
            </div>
          </div>
        </div>
      </div>

      <ul className="relative z-10 flex flex-wrap gap-2">
        {chips.map(({ Icon, label }) => (
          <li key={label} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-display text-label-md ring-1 ring-white/15 backdrop-blur">
            <Icon className="size-4 text-[#a9f3c5]" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </aside>
  )
}