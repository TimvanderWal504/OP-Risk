import { useTranslation } from 'react-i18next'
import { ModalShell } from './ModalShell'
import { GlassPanel } from './GlassPanel'
import { Button } from './Button'
import { LockIcon } from './icons'
import { tDynamic } from '../../i18n/useT'

export interface MissionPanelProps {
  missionId: string
  onClose: () => void
}

/**
 * Toont de eigen geheime missie (FO §2, §6.1) — naam + omschrijving komen uitsluitend via
 * `tDynamic` uit `locales/missions.ts` (nooit een ruwe server-tekst rechtstreeks renderen,
 * zie die doc-comment). Zelfde full-screen `ModalShell`-patroon als `DefendStep.tsx`, maar op
 * een lagere z-index (`z-50` t.o.v. `DefendStep`'s `z-[60]`): dit is een vrijwillige "even
 * kijken"-actie van de speler, geen verplichte spelbeslissing — een echte combat-modal moet
 * altijd boven dit paneel kunnen verschijnen.
 *
 * Eyebrow "GEHEIME MISSIE" + hangslot-regel "Alleen zichtbaar voor jou" zijn pure chrome
 * (`locales/missionPanel.ts`, niet `missions.ts`): ze benoemen het privacy-karakter van het
 * paneel zelf, niet de missie-inhoud. Geen voortgangsindicator — er bestaat geen
 * missievoortgang-berekening (noch in de rules engine, noch in het FO), dus dat blijft hier
 * bewust weg i.p.v. verzonnen.
 */
export function MissionPanel({ missionId, onClose }: MissionPanelProps) {
  const { t } = useTranslation('missionPanel')

  return (
    <ModalShell
      context="phone"
      animated
      className="absolute inset-0 z-50 flex flex-col px-gutter pt-[52px] pb-gutter"
      style={{ borderRadius: 0 }}
    >
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-3">
        <span className="flex items-center justify-center gap-1.5 text-xs text-fg-muted">
          <LockIcon className="h-3.5 w-3.5" />
          {t('visibleOnlyToYou')}
        </span>
        <GlassPanel elevation="raised" context="phone" className="flex flex-col items-center gap-3.5 text-center">
          <span className="font-body text-xs font-extrabold tracking-[.12em] text-fg-muted uppercase">
            {t('secretLabel')}
          </span>
          <h1 className="font-display text-h1 font-extrabold text-fg">{tDynamic(`${missionId}.name`, 'missions')}</h1>
          <p className="font-body text-body text-fg-secondary">{tDynamic(`${missionId}.description`, 'missions')}</p>
        </GlassPanel>
      </div>
      <Button variant="secondary" onClick={onClose}>
        {t('close')}
      </Button>
    </ModalShell>
  )
}
