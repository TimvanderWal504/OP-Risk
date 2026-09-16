import { useTranslation } from 'react-i18next'
import { Badge } from './Badge'
import { ColorSymbol } from './ColorSymbol'
import type { PlayerColorDto } from '../../types/GameState'
import { tDynamic } from '../../i18n/useT'

export interface PlayerMissionRevealProps {
  playerName: string
  color: PlayerColorDto | null
  /** Gezet voor elke kaart in de missie-onthulling-sectie (FO §7). */
  missionId?: string
  /** Of deze speler zijn/haar geheime missie daadwerkelijk voltooide — afgeleid in
   *  `TvGameOverScreen` uit `state.winners` (bij winconditie Missies wint wie zijn missie
   *  voltooit, FO §7). */
  completed?: boolean
}

/**
 * Kleurbadge + naam + optioneel de onthulde missietekst en een voltooid/niet-gehaald-badge
 * (FO §7: "missie-onthulling van alle spelers") — één kaart in `TvGameOverScreen`'s
 * missie-grid. De winnaarskop zelf gebruikt inmiddels een eigen, grotere opmaak (geleend van
 * `TvCombatOverlay`'s eliminatie-headline-schaal), dus dit component is nu uitsluitend voor de
 * missiekaarten. Missienaam/-omschrijving komen uitsluitend via `tDynamic` uit
 * `locales/missions.ts`.
 *
 * De voltooid/niet-gehaald-status gebruikt `Badge` (`pitch-solid`/`silver-outline`, DESIGN.md
 * § Badges/Chips) — de eerste echte toepassing van die component, niet een nieuwe stijl.
 */
export function PlayerMissionReveal({ playerName, color, missionId, completed }: PlayerMissionRevealProps) {
  const { t } = useTranslation('gameOverTv')

  return (
    <div className="flex items-center gap-4">
      {color?.symbol && (
        <span
          className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-h2"
          style={{ background: color.hex, color: color.onHex }}
        >
          <ColorSymbol symbol={color.symbol} />
        </span>
      )}
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="font-display text-h1 font-extrabold text-fg">{playerName}</div>
          {completed !== undefined && (
            <Badge tone={completed ? 'pitch-solid' : 'silver-outline'}>
              {completed ? t('missionCompleted') : t('missionNotCompleted')}
            </Badge>
          )}
        </div>
        {missionId && (
          <div className="font-body text-body text-fg-secondary">
            {tDynamic(`${missionId}.name`, 'missions')} — {tDynamic(`${missionId}.description`, 'missions')}
          </div>
        )}
      </div>
    </div>
  )
}
