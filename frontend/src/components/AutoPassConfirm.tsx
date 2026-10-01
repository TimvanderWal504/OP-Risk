import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalShell } from './ui/ModalShell'
import { Button } from './ui/Button'
import { Footer } from './ui/Footer'

export interface AutoPassConfirmProps {
  playerName: string
  /** Zet de speler op auto-pass; een weigering komt als fout-toast via `useGameState`. */
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Bevestiging voor de host-actie "Auto-pass" (DESIGN.md § Auto-pass, FO §11.2): wat de server dan
 * voor de speler doet en hoe die terugkomt. De teksten noemen de speler bij naam, nooit "hij"/"zij".
 * Zelfde full-screen `ModalShell`-patroon als `GameInfoPanel`, één niveau erboven (`z-[55]`), want
 * het opent vanuit Spelinfo.
 */
export function AutoPassConfirm({ playerName, onConfirm, onCancel }: AutoPassConfirmProps) {
  const { t } = useTranslation('autoPass')
  const [sending, setSending] = useState(false)

  const confirm = async () => {
    setSending(true)

    try {
      await onConfirm()
    } finally {
      setSending(false)
    }
  }

  return (
    <ModalShell
      context="phone"
      animated
      className="absolute inset-0 z-[55] flex flex-col gap-3 px-gutter pt-[52px] pb-gutter"
      style={{ borderRadius: 0 }}
    >
      <h1 className="font-display text-h1 font-extrabold text-fg">{t('confirm.title', { name: playerName })}</h1>
      <div className="flex flex-1 flex-col gap-2 font-body text-body text-fg-secondary">
        <p className="m-0">{t('confirm.turns', { name: playerName })}</p>
        <p className="m-0">{t('confirm.defence', { name: playerName })}</p>
        <p className="m-0">{t('confirm.return', { name: playerName })}</p>
      </div>
      <Footer>
        <Button variant="secondary" onClick={onCancel}>
          {t('confirm.cancel')}
        </Button>
        <Button onClick={() => void confirm()} disabled={sending}>
          {t('confirm.submit')}
        </Button>
      </Footer>
    </ModalShell>
  )
}
