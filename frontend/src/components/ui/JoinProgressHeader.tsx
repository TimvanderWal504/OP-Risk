import { useTranslation } from 'react-i18next'

export interface JoinProgressHeaderProps {
  /** 0-based index van de huidige join-stap. */
  currentStep: number
  /** Totaal aantal stappen (3 zonder rolstap, 4 met rolstap). */
  stepCount: number
}

/** Gedeelde chrome boven elke join-stap (Telefoon.dc.html L268-275): merknaam
 * + segmenten-voortgangsbalk. Segmenten tot en met `currentStep` zijn gevuld. */
export function JoinProgressHeader({ currentStep, stepCount }: JoinProgressHeaderProps) {
  const { t } = useTranslation('join')

  return (
    <div>
      <div className="mt-1.5 flex items-center gap-3">
        <span className="font-display text-[22px] font-black tracking-[.1em]">{t('appTitle')}</span>
      </div>
      <div className="my-4 flex gap-1.5">
        {Array.from({ length: stepCount }).map((_, idx) => (
          <span
            key={idx}
            className="h-[5px] flex-1 rounded-[3px]"
            style={{ background: idx <= currentStep ? 'var(--pitch-500)' : 'var(--border-strong)' }}
          />
        ))}
      </div>
    </div>
  )
}
