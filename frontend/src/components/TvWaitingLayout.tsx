import type { ReactNode } from 'react'
import { lobbyPanelScrim } from '../styles/glass-tokens'
import { TvTitleColumn } from './TvTitleColumn'

export interface TvWaitingLayoutProps {
  badge: string
  status: string
  /** De rechter glas-rail. */
  children: ReactNode
}

/**
 * Titel links en een compacte glas-rail rechts, met de bijbehorende links/rechts-wash
 * (`lobbyPanelScrim`) over de stage-achtergrond. Gedeeld door de TV-lobby en het koppelscherm van
 * "TV opzetten" (`TvPairPage`) — de enige twee TV-schermen met deze split.
 */
export function TvWaitingLayout({ badge, status, children }: TvWaitingLayoutProps) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="absolute inset-0" style={{ background: lobbyPanelScrim }} />

      <div className="relative flex flex-1 items-stretch gap-12 p-[64px_66px]">
        {/* Links: titel bij het kasteel */}
        <TvTitleColumn badge={badge} status={status} />

        {/* Rechts: compacte glas-rail, altijd zichtbaar */}
        <div className="flex w-[620px] flex-none flex-col gap-5">{children}</div>
      </div>
    </div>
  )
}
