import { useParams } from 'react-router-dom'
import { useTvGame } from '../../hooks/useTvGame'
import { LobbyQrPanel } from '../../components/LobbyQrPanel'
import { LobbyPlayerList } from '../../components/LobbyPlayerList'
import { LobbySettingsSummary } from '../../components/LobbySettingsSummary'
import { GamePhaseDto } from '../../types/GameState'

export function TvPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { state, error } = useTvGame(gameId!)

  if (error) {
    return <div className="flex h-full items-center justify-center text-loss">Onbekend spel.</div>
  }

  if (!state) {
    return <div className="flex h-full items-center justify-center text-fg-muted">Verbinden…</div>
  }

  if (state.phase !== GamePhaseDto.Lobby) {
    return (
      <div className="flex h-full items-center justify-center text-fg-muted">
        Spel is gestart — het bord volgt in een latere bouwplak.
      </div>
    )
  }

  return (
    <div className="flex h-full gap-9 p-14 bg-hero-pattern">
      <LobbyQrPanel gameId={state.gameId} />
      <div className="flex-1">
        <LobbyPlayerList
          players={state.players}
          colors={state.colors}
          roles={state.roles}
          maxPlayers={state.colors.length}
        />
      </div>
      <div className="w-96 flex-none">
        <LobbySettingsSummary settings={state.settings} />
      </div>
    </div>
  )
}
