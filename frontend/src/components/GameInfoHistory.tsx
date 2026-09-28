import { useTranslation } from 'react-i18next'
import { useActionLog } from '../hooks/useActionLog'
import { actionActor, actionSentence } from '../locales/actionSentence'
import type { GameStateDto, RecentActionDto } from '../types/GameState'
import { ColorAvatar } from './ui/ColorAvatar'
import { GlassPanel } from './ui/GlassPanel'

export interface GameInfoHistoryProps {
  state: GameStateDto
  /** Het volledige verloop ophalen (`useGameState.loadActionLog`); dit component roept zelf geen SignalR aan. */
  loadActionLog: () => Promise<RecentActionDto[]>
}

/**
 * Tabblad "Spelverloop" van spelinfo (besluit gebruiker 2026-09-26): elke actie van het spel,
 * nieuwste bovenaan, als stilstaande lijst. Dezelfde zinnen als de TV-ticker (`actionSentence`).
 *
 * Wordt alleen gemount als het tabblad actief is, dus het verloop wordt pas dan opgehaald. De
 * ververssleutel is het korte verloop uit de state (`recentActions`, dat bij elke actie meekomt):
 * verandert daar iets, ook een regel die alleen bijwerkt, dan haalt het tabblad het volledige
 * verloop opnieuw op.
 */
export function GameInfoHistory({ state, loadActionLog }: GameInfoHistoryProps) {
  const { t } = useTranslation('gameInfo')
  const { t: tSentence } = useTranslation('actionTicker')
  const { actions, status } = useActionLog(loadActionLog, JSON.stringify(state.recentActions))

  if (status !== 'ready' || actions.length === 0) {
    const message = status === 'loading' ? 'history.loading' : status === 'error' ? 'history.error' : 'history.empty'

    return <p className="font-body text-sm text-fg-muted">{t(message)}</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {actions.map((action) => {
        const { actor, color } = actionActor(action, state)

        return (
          <GlassPanel
            key={action.sequence}
            elevation="base"
            context="phone"
            padding="none"
            className="flex items-center gap-3 rounded-[14px] px-3.5 py-[11px]"
            style={{ borderColor: 'var(--border)' }}
          >
            <ColorAvatar color={color} variant="row" />
            <p className="min-w-0 flex-1 font-body text-sm text-fg">
              {actor && <b className="font-extrabold">{actor.name} </b>}
              {actionSentence(action, state, tSentence)}
            </p>
          </GlassPanel>
        )
      })}
    </div>
  )
}
