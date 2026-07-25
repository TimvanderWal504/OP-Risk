import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from './ui/TextField'
import { Footer } from './ui/Footer'
import { Button } from './ui/Button'
import { JoinProgressHeader } from './ui/JoinProgressHeader'

export interface JoinNameStepProps {
  onSubmit: (name: string) => void
  stepIndex: number
  stepCount: number
  submitting?: boolean
  error?: string | null
}

/** Eerste join-stap (FO §3): naam invoeren. */
export function JoinNameStep({ onSubmit, stepIndex, stepCount, submitting = false, error = null }: JoinNameStepProps) {
  const { t } = useTranslation(['join', 'common'])
  const [name, setName] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (name.trim()) {
      onSubmit(name.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-5 pt-[18px] pb-[22px]">
      <JoinProgressHeader currentStep={stepIndex} stepCount={stepCount} />
      <div className="flex flex-1 flex-col">
        <h1 className="font-display text-[26px] font-extrabold">{t('join:name.title')}</h1>
        <p className="mt-1.5 mb-[22px] text-[15px] text-fg-muted">{t('join:name.sub')}</p>
        <TextField
          autoFocus
          value={name}
          onChange={setName}
          placeholder={t('join:name.placeholder')}
        />
      </div>
      <Footer error={error}>
        <Button type="submit" disabled={submitting || !name.trim()}>
          {t('common:actions.next')}
        </Button>
      </Footer>
    </form>
  )
}
