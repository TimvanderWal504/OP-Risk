import { useTranslation } from 'react-i18next'
import { Badge } from './ui/Badge'

export interface TvPageHeaderProps {
  badge: string
}

/** Branding-regel boven elk TV-fasescherm (Lobby, OrderRoll, …), met een fase-kicker. */
export function TvPageHeader({ badge }: TvPageHeaderProps) {
  const { t } = useTranslation('common')

  return (
    <div className="mb-8 flex flex-none items-center justify-between">
      <div className="flex items-baseline items-center gap-4">
        <span className="font-display text-h1 font-display text-[40px] font-black tracking-wide">{t('tv.brand')}</span>
        <span className="h-1.5 w-14 rounded-full bg-pitch-500" />
        <span className="font-mono text-fg-muted tracking-wide">{t('tv.subtitle')}</span>
      </div>
      <Badge>{badge}</Badge>
    </div>
  )
}
