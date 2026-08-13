import { useTranslation } from 'react-i18next'
import { GlassPanel } from '../../../components/ui/GlassPanel'
import { PhoneScreen } from '../../../components/ui/PhoneScreen'

/**
 * Het scherm voor een fase die deze bundel (nog) niet kent: de nog niet gebouwde fases
 * InProgress/Finished, en de versie-skew-fallback uit `resolvePhoneScreen`. Bewust een
 * expliciet geregistreerd scherm en geen `null`, zodat de speler iets ziet in plaats van
 * een leeg toestel.
 */
export function PhonePlaceholderScreen() {
  const { t } = useTranslation('lobby')

  return (
    <PhoneScreen className="items-center justify-center text-center">
      {/* BEVINDING, opgelost (2026-08-10): kaal op de stage-achtergrond, zie OrderRollWaitStep.tsx. */}
      <GlassPanel elevation="base" context="phone" padding="none" className="rounded-2xl px-4 py-2 text-fg-muted">
        {t('placeholder.phone')}
      </GlassPanel>
    </PhoneScreen>
  )
}
