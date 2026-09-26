import { useTranslation } from 'react-i18next'
import { TvWaitingLayout } from '../../../components/TvWaitingLayout'
import { LobbyPlayerList } from '../../../components/LobbyPlayerList'
import { LobbyQrPanel } from '../../../components/LobbyQrPanel'
import { LobbySettingsSummary } from '../../../components/LobbySettingsSummary'
import type { TvScreenProps } from './tvScreens'

/**
 * Het lobbyscherm op de TV: titel links en een compacte rail rechts (joinen via QR, wie er
 * binnen is, de gekozen instellingen), over de persistente stage-achtergrond uit `TvShell`
 * (cinematische veldslag-illustratie + gedeelde verticale scrim, zie `TvStageBackground`).
 * De links/rechts-wash die bij deze paneelindeling hoort zit in `TvWaitingLayout` — geen andere
 * fase heeft deze split (alleen het koppelscherm van "TV koppelen", vóór er een spel is), dus die
 * laag blijft daar i.p.v. in de gedeelde achtergrond (zie `lobbyPanelScrim` in glass-tokens.ts).
 */
export function TvLobbyScreen({ state }: TvScreenProps) {
  const { t } = useTranslation('lobby')

  return (
    <TvWaitingLayout badge={t('header.badge')} status={t('waiting.forHost')}>
      <LobbyQrPanel gameId={state.gameId} />
      <LobbyPlayerList
        players={state.players}
        colors={state.colors}
        roles={state.roles}
        maxPlayers={state.colors.length}
      />
      <LobbySettingsSummary settings={state.settings} />
    </TvWaitingLayout>
  )
}
