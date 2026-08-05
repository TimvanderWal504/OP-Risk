import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerColorDto } from '../types/GameState'
import { TextField } from './ui/TextField'
import { SelectableOption } from './ui/SelectableOption'
import { ColorSymbol } from './ui/ColorSymbol'
import { JoinProgressHeader } from './ui/JoinProgressHeader'
import { Footer } from './ui/Footer'
import { Button } from './ui/Button'
import { tDynamic } from '../i18n/useT'

export interface JoinNameColorStepProps {
  onSubmit: (name: string, colorId: string) => void
  colors: PlayerColorDto[]
  takenColorIds: string[]
  stepIndex: number
  stepCount: number
  /** Naam ligt al vast (bv. terug-navigatie vanaf de rolstap): alleen de kleur is nog aanpasbaar. */
  fixedName?: string
  submitting?: boolean
  error?: string | null
}

/**
 * Samengevoegde eerste join-stap (FO §3): naam én kleur op één scrollbare stap
 * (`joinNameColor`-sectie in het oorspronkelijke design). Select-
 * dan-bevestig voor de kleur, net als het losse kleur-kiezen daarvoor: één klik zet
 * de lokale keuze, `onSubmit` (de server-call) gaat pas bij de bevestigingsknop.
 */
export function JoinNameColorStep({
  onSubmit,
  colors,
  takenColorIds,
  stepIndex,
  stepCount,
  fixedName,
  submitting = false,
  error = null,
}: JoinNameColorStepProps) {
  const { t } = useTranslation(['join', 'common'])
  const [name, setName] = useState(fixedName ?? '')
  const [pendingColorId, setPendingColorId] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0 && pendingColorId !== null && !submitting

  return (
    <div className="flex flex-1 flex-col px-5 pt-[18px] pb-[22px]">
      <JoinProgressHeader currentStep={stepIndex} stepCount={stepCount} />
      <div className="flex flex-1 flex-col gap-0 overflow-y-auto pr-0.5">
        <h1 className="font-display text-[24px] font-extrabold mb-1">{t('join:name.title')}</h1>
        {fixedName ? (
          <div className="flex items-center gap-2.5 rounded-[16px] border border-silver-600 bg-[var(--atlas-t05)] p-[14px_18px] font-display text-[24px] font-bold">
            {fixedName}
          </div>
        ) : (
          <TextField
            autoFocus
            value={name}
            onChange={setName}
            placeholder={t('join:name.placeholder')}
          />
        )}
        <h2 className="font-display text-[24px] font-extrabold mt-7 mb-3">{t('join:color.title')}</h2>
        <div className="grid grid-cols-2 gap-[11px]">
          {colors.map((color) => {
            const taken = takenColorIds.includes(color.id)
            const selected = pendingColorId === color.id

            return (
              <SelectableOption
                key={color.id}
                selected={selected}
                disabled={taken}
                onSelect={() => setPendingColorId(color.id)}
                className="flex min-h-[58px] items-center gap-3 px-[14px]"
                unselectedBorderVar="var(--border)"
                disabledBorderVar="var(--border)"
              >
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-input text-[19px]"
                  style={{ background: color.hex, color: color.onHex }}
                >
                  <ColorSymbol symbol={color.symbol} />
                </span>
                <span className="font-display text-[16px] font-bold">{tDynamic(color.id, 'colors')}</span>
                {taken && <span className="absolute right-3 text-xs text-fg-muted">{t('join:color.taken')}</span>}
              </SelectableOption>
            )
          })}
        </div>
      </div>
      <Footer error={error}>
        <Button
          disabled={!canSubmit}
          onClick={() => pendingColorId && onSubmit(name.trim(), pendingColorId)}
        >
          {t('common:actions.next')}
        </Button>
      </Footer>
    </div>
  )
}
