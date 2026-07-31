import { useTranslation } from 'react-i18next'

/**
 * Het host-scherm voor een fase die deze bundel (nog) niet toont: de nog niet gebouwde
 * spelfases en de versie-skew-fallback uit `resolveTvScreen`.
 */
export function TvPlaceholderScreen() {
  const { t } = useTranslation('lobby')

  return (
    <div className="flex h-full mx-auto max-w-[1550px] items-center justify-center text-fg-muted">
      {t('placeholder.tv')}
    </div>
  )
}
