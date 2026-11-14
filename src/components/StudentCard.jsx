import { BadgeCheck, GraduationCap } from 'lucide-react'
import { usePrefs } from '../lib/prefs'
import { abbreviate } from '../lib/abbreviate'
import { academicYear, initialsOf } from '../lib/format'


export default function StudentCard({
  firstName = '',
  lastName = '',
  university = '',
  faculty = '',
  level = null,
  specialty = '',
  photoUrl = null,
  matricule,
  matriculeIsFinal = false,
}) {
  const { t } = usePrefs()
  const name = `${firstName} ${lastName}`.trim()
  const place = [abbreviate(university), abbreviate(faculty)].filter(Boolean).join(' · ')
  const placeFull = [university, faculty].filter(Boolean).join(' · ')
  const study = [level ? t('card.level', { n: Number(level) }) : '', abbreviate(specialty, { maxLetters: 4 })]
    .filter(Boolean)
    .join(' · ')
  const studyFull = [level ? t('card.level', { n: Number(level) }) : '', specialty].filter(Boolean).join(' · ')

  return (
    <div className="relative isolate flex h-56 flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br from-[#004328] via-[#0d5c3a] to-[#15803d] p-5 text-white shadow-xl ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-0.5">
      <GraduationCap aria-hidden="true" className="absolute -bottom-8 -right-8 -z-10 size-44 text-white/10" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:14px_14px]"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <GraduationCap className="size-4" aria-hidden="true" />
          </span>
          <span className="font-display text-label-lg font-bold tracking-tight">SUCCESS · SUCCÈS</span>
        </div>
        <span className="rounded bg-white/20 px-2 py-0.5 font-mono text-label-sm tracking-widest backdrop-blur-sm">
          {academicYear()}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="size-16 shrink-0 rounded-xl object-cover shadow-md ring-2 ring-white/30" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-white/15 font-display text-headline-sm font-bold ring-2 ring-white/20"
          >
            {name ? initialsOf(firstName, lastName) : '?'}
          </span>
        )}
        <div className="min-w-0">
          <p className={`truncate font-display text-title-sm font-bold ${name ? '' : 'text-white/50'}`}>
            {name || t('card.namePlaceholder')}
          </p>
          <p title={placeFull} className={`truncate text-body-sm ${place ? 'text-white/90' : 'text-white/50'}`}>
            {place || t('card.universityPlaceholder')}
          </p>
          <p title={studyFull} className="truncate text-label-md text-white/80">{study || '\u00a0'}</p>
        </div>
      </div>

      <div className="-mx-5 -mb-5 flex items-center justify-between bg-black/15 px-5 py-2.5 backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-white/70">
            {matriculeIsFinal ? t('card.matricule') : t('card.matriculeSoon')}
          </span>
          <span className="font-mono text-label-lg font-bold tracking-wider text-[#a9f3c5] [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]">
            {matricule}
          </span>
        </div>
        <span className="flex items-center gap-1 text-label-md text-white/90">
          <BadgeCheck className="size-3.5 text-[#a9f3c5]" aria-hidden="true" />
          {t('card.status')}
        </span>
      </div>
    </div>
  )
}