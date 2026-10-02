import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from './ui/TextField'
import { Footer } from './ui/Footer'
import { Button } from './ui/Button'
import { GlassPanel } from './ui/GlassPanel'
import { PhoneScreen } from './ui/PhoneScreen'

export interface ReclaimPlayerStepProps {
  /** Neemt de plek met deze naam over (`RejoinAsPlayer`); een weigering komt als toast uit de hook. */
  onSubmit: (name: string) => Promise<void>
  onBack: () => void
}

/**
 * "Opnieuw verbinden" (TO §6.3) voor een speler op een nieuw tabblad of apparaat: alleen de naam
 * waarmee hij meedoet. Zelfde glaspaneel en invoerveld als de naamstap van de join-flow; de server
 * beslist of de naam precies één speler aanwijst.
 */
export function ReclaimPlayerStep({ onSubmit, onBack }: ReclaimPlayerStepProps) {
  const { t } = useTranslation('join')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = name.trim().length > 0 && !submitting

  const submit = async () => {
    setSubmitting(true)

    try {
      await onSubmit(name.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PhoneScreen>
      <div className="flex flex-1 flex-col gap-0 overflow-y-auto pr-0.5">
        <GlassPanel elevation="base" context="phone" className="rounded-2xl">
          <h1 className="mb-3 font-display text-size5 font-extrabold">{t('reclaim.title')}</h1>
          <p className="mb-3 mt-0 font-body text-body text-fg-muted">{t('reclaim.body')}</p>
          <TextField
            autoFocus
            value={name}
            onChange={setName}
            placeholder={t('name.placeholder')}
            ariaLabel={t('name.title')}
          />
        </GlassPanel>
      </div>
      <Footer>
        <Button disabled={!canSubmit} onClick={() => void submit()}>
          {t('reclaim.submit')}
        </Button>
        <Button variant="secondary" onClick={onBack}>
          {t('reclaim.back')}
        </Button>
      </Footer>
    </PhoneScreen>
  )
}
