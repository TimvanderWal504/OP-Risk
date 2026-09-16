import { useTranslation } from 'react-i18next'
import { GlassPanel } from './GlassPanel'
import { Button } from './Button'

export interface MissionChangedNoticeProps {
  onDismiss: () => void
}

/**
 * Korte melding wanneer de missie tussentijds wijzigt door de `EliminatePlayer`-fallbackregel
 * (FO §6.1) — niet bij de eerste toewijzing bij `StartGame`, zie `useMissionPanel`'s
 * wijzigingsdetectie. Geen eigen intro-/uitgangsanimatie: er bestaat nog geen toast-precedent
 * in `motion.ts` om een duur aan te ontlenen (frontend/CLAUDE.md: geen zelfverzonnen timing),
 * dus dit toont/verbergt instant totdat die waarde is vastgesteld. Positionering hoort bij de
 * aanroeper (`PhonePlayerHeader`).
 */
export function MissionChangedNotice({ onDismiss }: MissionChangedNoticeProps) {
  const { t } = useTranslation('missionPanel')

  return (
    <GlassPanel elevation="raised" context="phone" className="flex flex-col items-center gap-2 text-center">
      <p className="font-body text-body text-fg">{t('changedNotice')}</p>
      <Button variant="secondary" onClick={onDismiss}>
        {t('close')}
      </Button>
    </GlassPanel>
  )
}
