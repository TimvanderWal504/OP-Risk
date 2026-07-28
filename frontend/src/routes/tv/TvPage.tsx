import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTvGame } from '../../hooks/useTvGame'
import { useHeldPhase } from '../../hooks/useHeldPhase'
import { LobbyQrPanel } from '../../components/LobbyQrPanel'
import { LobbyPlayerList } from '../../components/LobbyPlayerList'
import { LobbySettingsSummary } from '../../components/LobbySettingsSummary'
import { OrderRollTvPanel } from '../../components/OrderRollTvPanel'
import { TvPageHeader } from '../../components/TvPageHeader'
import { GamePhaseDto } from '../../types/GameState'

/** Host-scherm.dc.html L34: de stage draait altijd in het donkere thema, ongeacht OS-voorkeur. */
function TvShell({ children }: { children: ReactNode }) {
  return <div className="dark h-full bg-hero-pattern">{children}</div>
}

export function TvPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { t } = useTranslation(['lobby', 'orderRoll'])
  const { state, error, orderRollThrows } = useTvGame(gameId!)
  const displayPhase = useHeldPhase(state?.phase)

  if (error) {
    return (
      <TvShell>
        <div className="flex h-full items-center justify-center text-loss">{t('lobby:tv.unknownGame')}</div>
      </TvShell>
    )
  }

  if (!state) {
    return (
      <TvShell>
        <div className="flex h-full items-center justify-center text-fg-muted">{t('lobby:tv.connecting')}</div>
      </TvShell>
    )
  }

  if (displayPhase === GamePhaseDto.OrderRoll) {
    return (
      <TvShell>
        <div className="flex h-full flex-col mx-auto max-w-[1550px] p-14 items-center justify-center">
            <OrderRollTvPanel
              players={state.players}
              colors={state.colors}
              throws={orderRollThrows}
              order={state.turnOrder}
            />
        </div>
      </TvShell>
    )
  }

  if (displayPhase !== GamePhaseDto.Lobby) {
    return (
      <TvShell>
        <div className="flex h-full mx-auto max-w-[1550px] items-center justify-center text-fg-muted">
          {t('lobby:placeholder.tv')}
        </div>
      </TvShell>
    )
  }

  return (
    <TvShell>
      <div className="flex h-full flex-col p-14 mx-auto max-w-[1550px]">
        <TvPageHeader badge={t('lobby:header.badge')} />
        <div className="flex gap-9 min-w-0 flex-1">
          <LobbyQrPanel gameId={state.gameId} />          
          <LobbyPlayerList
            players={state.players}
            colors={state.colors}
            roles={state.roles}
            maxPlayers={state.colors.length}
          />
          <LobbySettingsSummary settings={state.settings} />
        </div>
      </div>
    </TvShell>
  )
}
