import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/Button'
import { TvDisplayPanel } from './TvDisplayPanel'
import type { TvDisplaySettingsDto } from '../types/TvDisplay'

export interface TvDisplayAccessProps {
  settings: TvDisplaySettingsDto
  defaults: TvDisplaySettingsDto
  onChange: (settings: TvDisplaySettingsDto) => Promise<boolean>
  error?: string | null
}

/**
 * Knop "TV-weergave" plus het paneel dat hij opent (plan-testronde-tv punt 2) — voor de
 * host-schermen zonder `PhonePlayerHeader`: de lobby, de volgorde-worp en het
 * uitgeschakeld-scherm. Tijdens het spel zelf zit dezelfde toegang als actie in de header. De
 * aanroeper beslist of de speler host is; dit component rendert altijd.
 */
export function TvDisplayAccess({ settings, defaults, onChange, error = null }: TvDisplayAccessProps) {
  const { t } = useTranslation('tvDisplay')
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {t('title')}
      </Button>
      {open && (
        <TvDisplayPanel
          settings={settings}
          defaults={defaults}
          onChange={onChange}
          onClose={() => setOpen(false)}
          error={error}
        />
      )}
    </>
  )
}
