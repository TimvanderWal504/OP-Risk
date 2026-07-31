import { useTranslation } from 'react-i18next'
import lobbyBattlefield from '../../../design-reference/shared/assets/lobby-battlefield.png'
import { tvAnimations } from '../../../design-reference/shared/motion'
import { LobbyPlayerList } from '../../../components/LobbyPlayerList'
import { LobbyQrPanel } from '../../../components/LobbyQrPanel'
import { LobbySettingsSummary } from '../../../components/LobbySettingsSummary'
import type { TvScreenProps } from './tvScreens'

/**
 * Het lobbyscherm op de TV: cinematische veldslag-achtergrond met de titel links en een
 * compacte rail rechts (joinen via QR, wie er binnen is, de gekozen instellingen).
 */
export function TvLobbyScreen({ state }: TvScreenProps) {
  const { t } = useTranslation('lobby')

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <img
        src={lobbyBattlefield}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg,rgba(4,6,11,.82) 0%,rgba(4,6,11,.5) 26%,rgba(4,6,11,.12) 48%,rgba(4,6,11,.22) 62%,rgba(4,6,11,.72) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg,rgba(4,6,11,.55) 0%,rgba(4,6,11,.12) 30%,rgba(4,6,11,.25) 70%,rgba(4,6,11,.8) 100%)',
        }}
      />

      <div className="relative flex flex-1 items-stretch gap-12 p-[64px_66px]">
        {/* Links: titel bij het kasteel */}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="self-start rounded-chip border border-[rgba(242,193,78,.55)] bg-[rgba(4,6,11,.34)] px-[18px] py-[9px] font-body text-[16px] font-extrabold tracking-[.16em] text-[#f2c14e] uppercase backdrop-blur-[6px]">
            {t('header.badge')}
          </span>
          <div className="mt-[26px]">
            <div className="font-display text-[132px] leading-[.92] font-black tracking-[-.01em] text-[#f7f9fc] [text-shadow:0_6px_40px_rgba(4,6,11,.9),0_2px_8px_rgba(4,6,11,.8)]">
              OPERATIE
            </div>
            <div className="font-display text-[132px] leading-[.92] font-black tracking-[-.01em] text-[#f7f9fc] [text-shadow:0_6px_40px_rgba(4,6,11,.9),0_2px_8px_rgba(4,6,11,.8)]">
              ATLAS
            </div>
          </div>
          <div className="mt-[26px] flex items-center gap-4">
            <span className="inline-block h-[5px] w-16 rounded-full bg-pitch-500" />
            <span className="font-mono text-[20px] tracking-[.14em] text-[rgba(247,249,252,.82)] [text-shadow:0_2px_12px_rgba(4,6,11,.9)]">
              CAMPAGNE-TERMINAL
            </span>
          </div>
          <div className="mt-auto flex items-center gap-3 font-body text-[19px] text-[rgba(247,249,252,.72)] [text-shadow:0_2px_12px_rgba(4,6,11,.9)]">
            <span
              className="h-3 w-3 rounded-full bg-pitch-500 shadow-[0_0_14px_rgba(161,194,58,.8)]"
              style={{ animation: tvAnimations.waitingDot }}
            />
            {t('waiting.forHost')}
          </div>
        </div>

        {/* Rechts: compacte glas-rail, altijd zichtbaar */}
        <div className="flex w-[620px] flex-none flex-col gap-5">
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
    </div>
  )
}
