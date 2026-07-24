import type { PlayerDto } from '../types/Player'
import type { PlayerColorDto } from '../types/GameState'
import { PlayerAvatar } from './ui/PlayerAvatar'
import { Dice, type DiceValue } from './ui/Dice'

export interface OrderRollTvPanelProps {
  players: PlayerDto[]
  colors: PlayerColorDto[]
  throws: Record<string, number[]>
}

/** Order-roll-weergave op de TV (FO §2.1): per speler de laatste worp, of "wacht op worp". */
export function OrderRollTvPanel({ players, colors, throws }: OrderRollTvPanelProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="twc-eyebrow">Spelersvolgorde bepalen</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {players.map((player) => {
          const color = colors.find((c) => c.id === player.colorId)
          const dice = throws[player.id]

          return (
            <div
              key={player.id}
              className="flex items-center gap-4 rounded-card border border-border bg-white/3 p-4"
            >
              <PlayerAvatar colorHex={color?.hex} colorSymbol={color?.symbol} isHost={player.isHost} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-h3 font-bold">{player.name}</div>
                {dice ? (
                  <div className="text-sm text-fg-muted">Totaal: {dice[0] + dice[1]}</div>
                ) : (
                  <div className="text-sm text-fg-muted">Wacht op worp…</div>
                )}
              </div>
              {dice && (
                <div className="flex flex-none gap-2">
                  <Dice value={dice[0] as DiceValue} size={40} />
                  <Dice value={dice[1] as DiceValue} size={40} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
