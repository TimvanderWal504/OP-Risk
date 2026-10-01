import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GlassPanel } from './ui/GlassPanel'
import { Button } from './ui/Button'
import { PhoneScreen } from './ui/PhoneScreen'

export interface AutoPassScreenProps {
  /** Verbindt opnieuw (`RejoinGame`): de terugkeer die de regels al kennen (FO §11.2). */
  onReturn: () => Promise<void>
}

/**
 * "Je staat op auto-pass" (DESIGN.md § Auto-pass): voor een speler die op auto-pass staat terwijl
 * zijn telefoon nog verbonden was. Vorm van `PlayerEliminatedScreen`: route-level in `PhonePage`,
 * met de header erboven (Spelinfo blijft bereikbaar) en één gecentreerd paneel. "Ik ben terug" doet
 * niets nieuws: het verbindt opnieuw, en de server haalt de speler dan van auto-pass; met de nieuwe
 * state verdwijnt dit scherm vanzelf.
 */
export function AutoPassScreen({ onReturn }: AutoPassScreenProps) {
  const { t } = useTranslation('autoPass')
  const [returning, setReturning] = useState(false)

  const returnToGame = async () => {
    setReturning(true)

    try {
      await onReturn()
    } finally {
      setReturning(false)
    }
  }

  return (
    <PhoneScreen>
      <GlassPanel elevation="base" context="phone" padding="none" className="my-auto grid gap-5 rounded-2xl p-4 text-center">
        <div>
          <h2 className="m-0 font-display text-h2 font-extrabold text-fg">{t('screen.title')}</h2>
          <p className="mx-auto mt-2.5 mb-0 max-w-[280px] font-body text-body text-fg-muted">{t('screen.body')}</p>
        </div>
        <Button onClick={() => void returnToGame()} disabled={returning}>
          {t('screen.return')}
        </Button>
      </GlassPanel>
    </PhoneScreen>
  )
}
