import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { tvAnimations } from '../../../styles/motion'
import {
  glassBadgeBorder,
  glassBlur,
  glassSaturate,
  glassSurfaceOpaque,
  lobbyPanelScrim,
} from '../../../styles/glass-tokens'
import { LobbyPlayerList } from '../../../components/LobbyPlayerList'
import { LobbyQrPanel } from '../../../components/LobbyQrPanel'
import { LobbySettingsSummary } from '../../../components/LobbySettingsSummary'
import type { TvScreenProps } from './tvScreens'

/**
 * Het lobbyscherm op de TV: titel links en een compacte rail rechts (joinen via QR, wie er
 * binnen is, de gekozen instellingen), over de persistente stage-achtergrond uit `TvShell`
 * (cinematische veldslag-illustratie + gedeelde verticale scrim, zie `TvStageBackground`).
 * Dit scherm voegt zelf alleen nog de links/rechts-wash toe die bij de eigen paneelindeling
 * hoort — geen andere fase heeft deze titel-links/rail-rechts-split, dus die laag blijft hier
 * lokaal i.p.v. in de gedeelde achtergrond (zie `lobbyPanelScrim` in glass-tokens.ts).
 */
export function TvLobbyScreen({ state }: TvScreenProps) {
  const { t } = useTranslation('lobby')

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="absolute inset-0" style={{ background: lobbyPanelScrim }} />

      <div className="relative flex flex-1 items-stretch gap-12 p-[64px_66px]">
        {/* Links: titel bij het kasteel */}
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className="glass-panel self-start rounded-chip px-[18px] py-[9px] font-body text-h3 font-extrabold tracking-[.16em] text-[#c2cddd] uppercase"
            data-glass-filter="on"
            style={
              {
                '--glass-bg-opaque': glassSurfaceOpaque.raised,
                '--glass-border': glassBadgeBorder,
                '--glass-filter': `blur(${glassBlur.sm}px) saturate(${glassSaturate})`,
              } as CSSProperties
            }
          >
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
            <span className="font-body text-[20px] tracking-[.14em] text-[rgba(247,249,252,.82)] [text-shadow:0_2px_12px_rgba(4,6,11,.9)]">
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
