import { useState } from 'react'
import type { FormEvent } from 'react'
import { TextField } from './ui/TextField'
import { Footer } from './ui/Footer'
import { Button } from './ui/Button'

export interface JoinNameStepProps {
  onSubmit: (name: string) => void
  submitting?: boolean
  error?: string | null
}

/** Eerste join-stap (FO §3): naam invoeren. */
export function JoinNameStep({ onSubmit, submitting = false, error = null }: JoinNameStepProps) {
  const [name, setName] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (name.trim()) {
      onSubmit(name.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 p-5">
        <h1 className="font-display text-h1 font-bold">Hoe heet je?</h1>
        <TextField autoFocus value={name} onChange={setName} placeholder="Jouw naam" />
      </div>
      <Footer error={error}>
        <Button type="submit" disabled={submitting || !name.trim()}>
          Volgende ›
        </Button>
      </Footer>
    </form>
  )
}
