import { useTranslation } from 'react-i18next'
import { Dice, type DiceValue } from './ui/Dice'
import { Button } from './ui/Button'
import { GlassPanel } from './ui/GlassPanel'
import { phoneAnimations } from '../styles/motion'
import { PhoneScreen } from './ui/PhoneScreen'

export interface OrderRollWaitStepProps {
  myDice: number[] | undefined
  colorHex: string
  canRoll: boolean
  onRoll: () => void
  error?: string | null
}

/**
 * Order-roll-stap op de telefoon (FO §2.1): een
 * "Gooien"-knop zolang de order-roll nog niet afgerond is (state.orderRollState
 * niet leeg) — de server wijst een ongeldige poging af, de client repliceert de
 * tie-break-regel niet (frontend/CLAUDE.md, server-authoritative).
 */
export function OrderRollWaitStep({ myDice, colorHex, canRoll, onRoll, error = null }: OrderRollWaitStepProps) {
  const { t } = useTranslation('orderRoll')

  return (
    <PhoneScreen className="items-center gap-1 text-center">
      {/* Zonder eigen surface kan geen scrim-intensiteit titel/subtitel tegen een helder
          illustratiepunt houden (zie glass-tokens.ts §Telefoon-stage-achtergrond). Hergebruikt
          het bestaande chip-idioom (DESIGN.md § Components, "badge-silver-outline") i.p.v. een
          nieuw patroon. */}
      <GlassPanel elevation="base" context="phone" padding="none" className="flex flex-col items-center gap-1 rounded-2xl px-4 py-2.5">
        <p className="font-display text-[26px] font-black">{t('title')}</p>
        <p className="max-w-[280px] text-body text-fg-muted">{t('sub')}</p>
      </GlassPanel>

      <div className="flex flex-1 flex-col items-center justify-center gap-[22px]">
        {/* Gedeeld paneel onder de worp, zelfde ingreep als de dobbelsteen-picker in
            AttackFlowStep: één rustig vlak i.p.v. dobbelstenen kaal op de illustratie. Omvat ook
            de nog-niet-gegooid-staat, anders zweven de streepjes-placeholders alsnog kaal op de
            foto. */}
        <GlassPanel elevation="base" context="phone" className="flex w-full justify-center rounded-2xl">
          {myDice ? (
            <div className="flex gap-3">
              <Dice
                value={myDice[0] as DiceValue}
                colorHex={colorHex}
                context="phone"
                size={104}
                radius={22}
                padding={15}
                gap={6}
                pipSize={17}
                animation={phoneAnimations.waitDie}
              />
              <Dice
                value={myDice[1] as DiceValue}
                colorHex={colorHex}
                context="phone"
                size={104}
                radius={22}
                padding={15}
                gap={6}
                pipSize={17}
                animation={phoneAnimations.waitDie}
              />
            </div>
          ) : (
            <div className="flex gap-3" aria-label={t('notRolledYet')}>
              <div className="h-[104px] w-[104px] rounded-[22px] border-2 border-dashed border-border-strong" />
              <div className="h-[104px] w-[104px] rounded-[22px] border-2 border-dashed border-border-strong" />
            </div>
          )}
        </GlassPanel>
      </div>

      {error && <p className="text-loss">{error}</p>}

      {canRoll ? (
        <Button variant="primary" onClick={onRoll}>
          {t('rollButton')}
        </Button>
      ) : (
        <p className="w-full pt-1.5 text-sm text-fg-muted">{t('waitingForOthers')}</p>
      )}
    </PhoneScreen>
  )
}
