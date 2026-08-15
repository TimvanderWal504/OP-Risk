import type { PlayerColorDto } from '../../types/GameState'
import { ColorAvatar } from './ColorAvatar'
import { GlassPanel } from './GlassPanel'

export interface ActivePlayerBannerProps {
  /** Label vóór de spelersnaam, bv. "Aan de beurt" — met dubbele punt en de naam op de tweede regel. */
  turnOfLabel: string
  playerName: string
  color: PlayerColorDto | null | undefined
  /**
   * Faseduiding, bv. "Aanvallen" of "Legers plaatsen". Dit is de kóp van de kaart (en daarmee van
   * het scherm), ook al heet de prop nog `subtitle` — de naamgeving is bewust niet meeveranderd
   * om de drie route-schermen die 'm via {@link NotYourTurnStep} doorgeven niet te raken.
   * Noem de fase, geen opdracht aan de lezer: dit scherm is juist voor wie níét aan zet is.
   */
  subtitle: string
  /** Rechteropgestelde teller (bv. vrije gebieden), alleen in Claim's variant. */
  stat?: { value: number | string; label: string }
}

/**
 * "Nu aan zet"-banner — identieke kaart in alle substaten (padding 13px 14px, radius 16px,
 * gap 12px). De fase staat als kop boven de naam: de fase bepaalt wat je op dit scherm ziet en
 * is dus de titel van de pagina, de naam is de toelichting daarbij.
 */
export function ActivePlayerBanner({ turnOfLabel, playerName, color, subtitle, stat }: ActivePlayerBannerProps) {
  return (
    <GlassPanel elevation="base" context="phone" padding="none" className="flex items-center gap-3 rounded-2xl px-3.5 py-[13px]">
      <ColorAvatar color={color} variant="banner" />
      <div className="min-w-0 flex-1">
        {/* Kop + secundaire regel in dezelfde twee stappen als StatHeaderCard (`text-h2` boven
            `text-body text-fg-muted`), zodat beide kaarttypes dezelfde koptypografie delen.
            Hiërarchie zit in opacity, niet in de solide spelerskleur: die is getuned als
            vulkleur achter een avatar/gebied, niet als tekst op donker glas (groen/blauw zijn
            daar vrijwel onleesbaar) — de spelerskleur blijft zichtbaar in de avatar ernaast. */}
        <div className="font-display text-h2 font-extrabold">{subtitle}</div>
        <div className="font-body text-body text-fg-muted">
          {turnOfLabel}: {playerName}
        </div>
      </div>
      {stat && (
        <div className="flex-none text-right">
          <div className="font-display text-[26px] leading-none font-black text-silver-300">{stat.value}</div>
          <div className="font-body text-[10px] text-fg-muted">{stat.label}</div>
        </div>
      )}
    </GlassPanel>
  )
}
