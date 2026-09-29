import { useTranslation } from 'react-i18next'
import { tDynamic } from '../i18n/useT'
import { GlassPanel } from './ui/GlassPanel'
import { PhoneScreen } from './ui/PhoneScreen'

export interface AttritionWaitStepProps {
  eventId: string
  /**
   * Wat deze speler afstond: een aantal, of `0` als hij niets kón missen (al zijn gebieden op 1
   * leger). `null` als dat niet (meer) in het verloop staat — dan alleen de wachtregel.
   */
  removedCount: number | null
  /** Namen van wie nog kiest, in beurtvolgorde. */
  waitingForNames: string[]
}

/**
 * Wachtscherm tijdens "Legers verwijderen" voor wie al koos of niets kon missen (DESIGN.md § Event
 * Round). Noemt de reden bij "niets": wie legers kán missen, moet ze afstaan — nooit "hoeft niets".
 */
export function AttritionWaitStep({ eventId, removedCount, waitingForNames }: AttritionWaitStepProps) {
  const { t, i18n } = useTranslation('eventPhone')
  const names = new Intl.ListFormat(i18n.language, { type: 'conjunction' }).format(waitingForNames)

  return (
    <PhoneScreen className="justify-center">
      <GlassPanel elevation="base" context="phone" className="flex flex-col items-center gap-3 text-center">
        <h2 className="m-0 font-display text-h2 font-extrabold text-fg">{tDynamic(`${eventId}.name`, 'events')}</h2>
        {removedCount !== null && (
          <p className="m-0 font-body text-body text-fg-secondary">
            {removedCount === 0 ? t('wait.nothingToSpare') : t('wait.removed', { count: removedCount })}
          </p>
        )}
        {waitingForNames.length > 0 && <p className="m-0 font-body text-body text-fg-muted">{t('wait.waitingFor', { names })}</p>}
      </GlassPanel>
    </PhoneScreen>
  )
}
