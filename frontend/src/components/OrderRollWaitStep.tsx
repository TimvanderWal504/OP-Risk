import { useTranslation } from 'react-i18next'
import { Dice, type DiceValue } from './ui/Dice'
import { Button } from './ui/Button'

export interface OrderRollWaitStepProps {
  myDice: number[] | undefined
  canRoll: boolean
  onRoll: () => void
  error?: string | null
}

/**
 * Order-roll-stap op de telefoon (FO §2.1): een "Gooien"-knop zolang de order-roll nog niet
 * afgerond is (state.orderRollState niet leeg) — de server wijst een ongeldige poging af, de
 * client repliceert de tie-break-regel niet (frontend/CLAUDE.md, server-authoritative).
 */
export function OrderRollWaitStep({ myDice, canRoll, onRoll, error = null }: OrderRollWaitStepProps) {
  const { t } = useTranslation('orderRoll')

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-5 text-center">
      <p className="font-display text-h1 font-black">{t('title')}</p>

      {myDice ? (
        <div className="flex gap-3">
          <Dice value={myDice[0] as DiceValue} />
          <Dice value={myDice[1] as DiceValue} />
        </div>
      ) : (
        <p className="text-fg-muted">{t('notRolledYet')}</p>
      )}

      {error && <p className="text-loss">{error}</p>}

      {canRoll ? (
        <Button onClick={onRoll}>{t('rollButton')}</Button>
      ) : (
        <p className="text-fg-muted">{t('waitingForOthers')}</p>
      )}
    </div>
  )
}
