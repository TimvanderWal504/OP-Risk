import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerDto } from '../types/Player'
import type { PlayerColorDto } from '../types/GameState'
import { ColorSymbol } from './ui/ColorSymbol'
import { Dice, type DiceValue } from './ui/Dice'
import { GlassPanel } from './ui/GlassPanel'
import { tvAnimations } from '../styles/motion'

export interface OrderRollTvPanelProps {
  players: PlayerDto[]
  colors: PlayerColorDto[]
  throws: Record<string, number[]>
  /** Player-ids in eindvolgorde. Leeg/afwezig ⇒ ranglijst nog niet renderen. */
  order?: string[]
}

/** Order-roll-weergave op de TV (FO §2.1): per
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
      <GlassPanel
        elevation="base"
        context="tv"
        padding="none"
        className="mt-3 mb-1.5 flex flex-col items-center gap-1.5 px-10 py-5 text-center"
      >
        <h1 className="font-display text-[64px] font-black leading-none tracking-[-.02em]">
          {t('title')}
        </h1>
        <p className="text-h2 text-fg-muted">{t('sub')}</p>

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
              <div key={player.id} className="flex flex-col items-center gap-3.5 mt-4">
                {dice ? (
                  <>
                    <Dice
                      key={`d0-${diceKey}`}
                      value={dice[0] as DiceValue}
                      colorHex={color.hex}
                      context="tv"
                      size={118}
                      radius={22}
                      padding={16}
                      gap={6}
                      pipSize={20}
                      animation={dieAnimation}
                    />
                    <Dice
                      key={`d1-${diceKey}`}
                      value={dice[1] as DiceValue}
                      colorHex={color.hex}
                      context="tv"
                      size={118}
                      radius={22}
                      padding={16}
                      gap={6}
                      pipSize={20}
                      animation={dieAnimation}
                    />
                  </>
                ) : (
                  <div className="flex h-full w-[118px] items-center justify-center text-sm text-fg-muted">
                    {t('waitingForRoll')}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] text-sm"
                    style={{ background: color.hex, color: color.onHex }}
                  >
                    <ColorSymbol symbol={color.symbol} />
                  </span>
                  <span className="font-display text-h2 font-bold">{player.name}</span>
                </div>
              </div>
            )
          })}
        </div>
      </GlassPanel>

      {order && order.length > 0 && (
        <div className="mt-6 w-full max-w-[1500px]">
          <div className="mb-3.5 text-center font-body text-[16px] font-extrabold uppercase tracking-[.1em] text-fg-muted">
            {t('turnOrder')}
          </div>
          <div className="flex justify-center gap-4">
            {order.map((playerId, rank) => {
              const player = players.find((p) => p.id === playerId)
              const color = colors.find((c) => c.id === player?.colorId)
              if (!player || !color) return null
              const first = rank === 0

              return (
                <GlassPanel
                  key={playerId}
                  elevation={first ? 'raised' : 'base'}
                  context="tv"
                  padding="none"
                  className="flex max-w-[220px] flex-1 items-center gap-4 p-4"
                >
                  <span
                    className={`font-display text-[44px] font-black leading-none ${first ? 'text-silver-300' : 'text-fg-muted'}`}
                  >
                    {rank + 1}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-body"
                      style={{ background: color.hex, color: color.onHex }}
                    >
                      <ColorSymbol symbol={color.symbol} />
                    </span>
                    <div className="mt-1.5 truncate font-display text-h2 font-bold">{player.name}</div>
                  </div>
                </GlassPanel>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
