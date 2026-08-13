import { useTranslation } from 'react-i18next'

export interface JoinProgressHeaderProps {
  /** 0-based index van de huidige join-stap. */
  currentStep: number
  /** Totaal aantal stappen (3 zonder rolstap, 4 met rolstap). */
  stepCount: number
}

/** Gedeelde chrome boven elke join-stap: merknaam
 * + segmenten-voortgangsbalk. Segmenten tot en met `currentStep` zijn gevuld. */
export function JoinProgressHeader({ currentStep, stepCount }: JoinProgressHeaderProps) {
  const { t } = useTranslation('join')

  return (
    <div>
      {/* Geen eigen bovenmarge: het frame komt van `PhoneScreen`. De `mt-1.5` die hier
          tot 2026-08-13 stond, stapelde daar bovenop en zette de drie join-schermen 6px
          lager dan elk ander scherm. */}
      <div className="flex items-center gap-3">
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
