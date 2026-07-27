import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerDto } from '../types/Player'
import type { PlayerColorDto } from '../types/GameState'
import { ColorSymbol } from './ui/ColorSymbol'
import { Dice, type DiceValue } from './ui/Dice'
import { tvAnimations } from '../design-reference/shared/motion'

export interface OrderRollTvPanelProps {
  players: PlayerDto[]
  colors: PlayerColorDto[]
  throws: Record<string, number[]>
  /** Player-ids in eindvolgorde. Leeg/afwezig ⇒ ranglijst nog niet renderen. */
  order?: string[]
}

const DICE_BOX_SHADOW = '0 18px 40px rgba(0,0,0,.5),inset 0 3px 0 rgba(255,255,255,.25)'

/** Order-roll-weergave op de TV (FO §2.1, Host-scherm.dc.html L108-141): per
 * speler 2 dobbelstenen in zijn eigen kleur, of "wacht op worp"; daaronder de
 * eindvolgorde zodra de server die aanlevert. */
export function OrderRollTvPanel({ players, colors, throws, order }: OrderRollTvPanelProps) {
  const { t } = useTranslation('orderRoll')
  /** Onthoudt de laatst getoonde worp per speler, zodat alleen een écht
   * gewijzigde worp (tie-break-herworp) `diceRerollOrder` krijgt i.p.v. de
   * mount-only `orderRollDie`-entrance (motion.ts A3, inventory §2). */
  const [prevThrows, setPrevThrows] = useState(throws)
  const [lastDiceKeys, setLastDiceKeys] = useState<Record<string, string>>({})
  if (throws !== prevThrows) {
    setPrevThrows(throws)
    const next = { ...lastDiceKeys }
    players.forEach((player) => {
      const dice = prevThrows[player.id]
      if (dice) next[player.id] = `${dice[0]}-${dice[1]}`
    })
    setLastDiceKeys(next)
  }

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="mt-3 mb-1.5 font-display text-[64px] font-black leading-none tracking-[-.02em]">
        {t('title')}
      </h1>
      <p className="mb-1.5 text-[22px] text-fg-muted">{t('sub')}</p>

      <div className="flex flex-wrap justify-center gap-8" style={{ margin: 'auto' }}>
        {players.map((player, idx) => {
          const color = colors.find((c) => c.id === player.colorId)
          const dice = throws[player.id]
          if (!color) return null

          const diceKey = dice ? `${dice[0]}-${dice[1]}` : 'empty'
          const previousDiceKey = lastDiceKeys[player.id]
          const isReroll = dice !== undefined && previousDiceKey !== undefined && previousDiceKey !== diceKey
          const dieAnimation = isReroll ? tvAnimations.diceRerollOrder : tvAnimations.orderRollDie(idx)

          return (
            <div key={player.id} className="flex flex-col items-center gap-3.5">
              {dice ? (
                <>
                  <Dice
                    key={`d0-${diceKey}`}
                    value={dice[0] as DiceValue}
                    colorHex={color.hex}
                    colorOnHex={color.onHex}
                    size={118}
                    radius={22}
                    padding={16}
                    gap={6}
                    pipSize={20}
                    boxShadow={DICE_BOX_SHADOW}
                    animation={dieAnimation}
                  />
                  <Dice
                    key={`d1-${diceKey}`}
                    value={dice[1] as DiceValue}
                    colorHex={color.hex}
                    colorOnHex={color.onHex}
                    size={118}
                    radius={22}
                    padding={16}
                    gap={6}
                    pipSize={20}
                    boxShadow={DICE_BOX_SHADOW}
                    animation={dieAnimation}
                  />
                </>
              ) : (
                <div className="flex h-[118px] w-[118px] items-center justify-center text-sm text-fg-muted">
                  {t('waitingForRoll')}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] text-[13px]"
                  style={{ background: color.hex, color: color.onHex }}
                >
                  <ColorSymbol symbol={color.symbol} />
                </span>
                <span className="font-display text-[22px] font-bold">{player.name}</span>
              </div>
            </div>
          )
        })}
      </div>

      {order && order.length > 0 && (
        <div className="mt-6 w-full max-w-[1500px]">
          <div className="mb-3.5 text-center font-body text-[16px] font-black uppercase tracking-[.14em] text-fg-muted">
            {t('turnOrder')}
          </div>
          <div className="flex justify-center gap-4">
            {order.map((playerId, rank) => {
              const player = players.find((p) => p.id === playerId)
              const color = colors.find((c) => c.id === player?.colorId)
              if (!player || !color) return null
              const first = rank === 0

              return (
                <div
                  key={playerId}
                  className={`flex max-w-[220px] flex-1 items-center gap-4 rounded-[16px] border p-4 ${
                    first ? 'border-gold-600 bg-gold-400/12' : 'border-border bg-[var(--atlas-row)]'
                  }`}
                >
                  <span
                    className={`font-display text-[44px] font-black leading-none ${first ? 'text-gold-300' : 'text-fg-muted'}`}
                  >
                    {rank + 1}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-[15px]"
                      style={{ background: color.hex, color: color.onHex }}
                    >
                      <ColorSymbol symbol={color.symbol} />
                    </span>
                    <div className="mt-1.5 truncate font-display text-[22px] font-bold">{player.name}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
