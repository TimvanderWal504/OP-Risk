import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerColorDto } from '../types/GameState'
import { TextField } from './ui/TextField'
import { SelectableOption } from './ui/SelectableOption'
import { ColorSymbol } from './ui/ColorSymbol'
import { JoinProgressHeader } from './ui/JoinProgressHeader'
import { Footer } from './ui/Footer'
import { Button } from './ui/Button'
import { GlassPanel } from './ui/GlassPanel'
import { tDynamic } from '../i18n/useT'
import { PhoneScreen } from './ui/PhoneScreen'

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
    <PhoneScreen>
      <JoinProgressHeader currentStep={stepIndex} stepCount={stepCount} />
      {/* Twee secties, elk één glaspaneel dat de kop én zijn bediening omsluit — BEVINDING
          opgelost (2026-08-13, gebruiker gescreenshot): de koppen hadden hun eigen zwevende
          pil-paneel los van het veld/raster eronder, waardoor drie los geblurde vlakken elk een
          ander stuk van de stage-illustratie vingen en de kop niet zichtbaar bij zijn bediening
          hoorde. Nu draagt het paneel de groepering; de nesting-guard schakelt de blur van het
          genestelde TextField/naamveld automatisch uit (rand blijft, zodat het invoerveld nog
          steeds als invoerveld leest). Zelfde principe als de dobbelsteen-picker in
          AttackFlowStep: één rustig vlak per samenhangende set, niet per element. */}
      <div className="flex flex-1 flex-col gap-0 overflow-y-auto pr-0.5">
        <GlassPanel elevation="base" context="phone" className="rounded-2xl">
          <h1 className="mb-3 font-display text-[24px] font-extrabold">{t('join:name.title')}</h1>
          {fixedName ? (
            <GlassPanel
              elevation="raised"
              context="phone"
              padding="none"
              className="flex items-center gap-2.5 rounded-[16px] p-[14px_18px] font-display text-[24px] font-bold"
              style={{ borderColor: 'var(--silver-600)' }}
            >
              {fixedName}
            </GlassPanel>
          ) : (
            <TextField
              autoFocus
              value={name}
              onChange={setName}
              placeholder={t('join:name.placeholder')}
            />
          )}
        </GlassPanel>
        <GlassPanel elevation="base" context="phone" className="mt-7 rounded-2xl">
          <h2 className="mb-3 font-display text-[24px] font-extrabold">{t('join:color.title')}</h2>
          <div role="radiogroup" aria-label={t('join:color.title')} className="grid grid-cols-2 gap-[11px]">
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
        </GlassPanel>
      </div>
      <Footer error={error}>
        <Button
          disabled={!canSubmit}
          onClick={() => pendingColorId && onSubmit(name.trim(), pendingColorId)}
        >
          {t('common:actions.next')}
        </Button>
      </Footer>
    </PhoneScreen>
  )
}
