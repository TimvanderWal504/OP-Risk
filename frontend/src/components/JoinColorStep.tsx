import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerColorDto } from '../types/GameState'
import { SelectableOption } from './ui/SelectableOption'
import { JoinProgressHeader } from './ui/JoinProgressHeader'
import { Footer } from './ui/Footer'
import { Button } from './ui/Button'
import { tDynamic } from '../i18n/useT'

export interface JoinColorStepProps {
  colors: PlayerColorDto[]
  takenColorIds: string[]
  onPick: (colorId: string) => void
  stepIndex: number
  stepCount: number
  error?: string | null
}

/** Tweede join-stap (FO §3): kleur kiezen, bezette kleuren live geblokkeerd.
 * Select-dan-bevestig (Telefoon.dc.html L290-300): een klik zet alleen de
 * lokale keuze, `onPick` (de server-call) gaat pas bij de bevestigingsknop. */
export function JoinColorStep({
  colors,
  takenColorIds,
  onPick,
  stepIndex,
  stepCount,
  error = null,
}: JoinColorStepProps) {
  const { t } = useTranslation('join')
  const [pendingColorId, setPendingColorId] = useState<string | null>(null)

  return (
    <div className="flex flex-1 flex-col gap-4 p-5">
      <JoinProgressHeader currentStep={stepIndex} stepCount={stepCount} />
      <div>
        <h1 className="font-display text-[26px] font-extrabold">{t('color.title')}</h1>
        <p className="mt-1.5 text-[15px] text-fg-muted">{t('color.sub')}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {colors.map((color) => {
          const taken = takenColorIds.includes(color.id)
          const selected = pendingColorId === color.id

          return (
            <SelectableOption
              key={color.id}
              selected={selected}
              disabled={taken}
              onSelect={() => setPendingColorId(color.id)}
              className="flex min-h-16 items-center gap-3 px-4"
              unselectedBorderVar="var(--border)"
              disabledBorderVar="var(--border)"
            >
              <span
                className="h-9 w-9 flex-none rounded-input"
                style={{ background: color.hex }}
                aria-hidden
              />
              <span className="font-display font-bold">{tDynamic(color.id, 'colors')}</span>
              {taken && <span className="absolute right-3 text-xs text-fg-muted">{t('color.taken')}</span>}
              {selected && (
                <span className="absolute right-3 text-pitch-400" aria-hidden>
                  {'✓'}
                </span>
              )}
            </SelectableOption>
          )
        })}
      </div>
      <Footer error={error}>
        <Button disabled={!pendingColorId} onClick={() => pendingColorId && onPick(pendingColorId)}>
          {t('color.confirm')}
        </Button>
      </Footer>
    </div>
  )
}
