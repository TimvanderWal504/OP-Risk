import { useTranslation } from 'react-i18next'

/**
 * Het scherm voor een fase die deze bundel (nog) niet kent: de nog niet gebouwde fases
 * InProgress/Finished, en de versie-skew-fallback uit `resolvePhoneScreen`. Bewust een
 * expliciet geregistreerd scherm en geen `null`, zodat de speler iets ziet in plaats van
 * een leeg toestel.
 */
export function PhonePlaceholderScreen() {
  const { t } = useTranslation('lobby')

  return (
    <div className="flex h-full items-center justify-center p-5 text-center text-fg-muted">
      {t('placeholder.phone')}
    </div>
  )
}
