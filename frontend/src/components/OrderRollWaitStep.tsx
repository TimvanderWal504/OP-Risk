import { useTranslation } from 'react-i18next'
import { Dice, type DiceValue } from './ui/Dice'
import { Button } from './ui/Button'
import { phoneAnimations } from '../styles/motion'

export interface OrderRollWaitStepProps {
  myDice: number[] | undefined
  colorHex: string
  colorOnHex: string
  canRoll: boolean
  onRoll: () => void
  error?: string | null
}

const DICE_BOX_SHADOW = '0 14px 34px rgba(0,0,0,.5),inset 0 3px 0 rgba(255,255,255,.25)'

/**
 * Order-roll-stap op de telefoon (FO §2.1): een
 * "Gooien"-knop zolang de order-roll nog niet afgerond is (state.orderRollState
 * niet leeg) — de server wijst een ongeldige poging af, de client repliceert de
 * tie-break-regel niet (frontend/CLAUDE.md, server-authoritative).
 */
export function OrderRollWaitStep({ myDice, colorHex, colorOnHex, canRoll, onRoll, error = null }: OrderRollWaitStepProps) {
  const { t } = useTranslation('orderRoll')

  return (
    <div className="flex flex-1 flex-col items-center gap-1 p-5 pt-6 text-center">
      <p className="font-display text-[26px] font-black">{t('title')}</p>
      <p className="max-w-[280px] text-body text-fg-muted">{t('sub')}</p>

      <div className="flex flex-1 flex-col items-center justify-center gap-[22px]">
        {myDice ? (
          <div className="flex gap-3">
            <Dice
              value={myDice[0] as DiceValue}
              colorHex={colorHex}
              colorOnHex={colorOnHex}
              size={104}
              radius={22}
              padding={15}
              gap={6}
              pipSize={17}
              boxShadow={DICE_BOX_SHADOW}
              animation={phoneAnimations.waitDie}
            />
            <Dice
              value={myDice[1] as DiceValue}
              colorHex={colorHex}
              colorOnHex={colorOnHex}
              size={104}
              radius={22}
              padding={15}
              gap={6}
              pipSize={17}
              boxShadow={DICE_BOX_SHADOW}
              animation={phoneAnimations.waitDie}
            />
          </div>
        ) : (
          <div className="flex gap-3" aria-label={t('notRolledYet')}>
            <div className="h-[104px] w-[104px] rounded-[22px] border-2 border-dashed border-border-strong" />
            <div className="h-[104px] w-[104px] rounded-[22px] border-2 border-dashed border-border-strong" />
          </div>
        )}
      </div>

      {error && <p className="text-loss">{error}</p>}

      {canRoll ? (
        <Button variant="primary" onClick={onRoll}>
          {t('rollButton')}
        </Button>
      ) : (
        <p className="w-full pt-1.5 text-sm text-fg-muted">{t('waitingForOthers')}</p>
      )}
    </div>
  )
}
