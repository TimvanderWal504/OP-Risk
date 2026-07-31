import { useTranslation } from 'react-i18next'
import { LobbyPlayerList } from '../../../components/LobbyPlayerList'
import { LobbyQrPanel } from '../../../components/LobbyQrPanel'
import { LobbySettingsSummary } from '../../../components/LobbySettingsSummary'
import { TvPageHeader } from '../../../components/TvPageHeader'
import type { TvScreenProps } from './tvScreens'

/** Het lobbyscherm op de TV: joinen via QR, wie er binnen is en de gekozen instellingen. */
export function TvLobbyScreen({ state }: TvScreenProps) {
  const { t } = useTranslation('lobby')

  return (
    <div className="flex h-full flex-col p-14 mx-auto max-w-[1550px]">
      <TvPageHeader badge={t('header.badge')} />
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
  )
}
