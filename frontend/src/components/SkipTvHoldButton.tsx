import { useTranslation } from 'react-i18next'
import { Button } from './ui/Button'

export interface SkipTvHoldButtonProps {
  onSkip: () => Promise<void>
}

/**
 * "Verder op TV" als losse secundaire knop (FO §2.2), voor host-schermen zonder header — het
 * volgordescherm. Zelfde vorm en plek als `TvDisplayAccess` erboven.
 */
export function SkipTvHoldButton({ onSkip }: SkipTvHoldButtonProps) {
  const { t } = useTranslation('common')

  return (
    <Button variant="secondary" onClick={() => void onSkip()}>
      {t('skipTvHold')}
    </Button>
  )
}
