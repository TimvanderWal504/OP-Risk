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
  /** Rechteropgestelde teller (bv. vrije gebieden), alleen in Claim's variant (L431). */
  stat?: { value: number | string; label: string }
}

/**
 * "Nu aan zet"-banner (`claimMineNot`- en `isIdle`-substaten in het oorspronkelijke design) —
 * identieke kaart in beide substaten (padding 13px 14px, radius 16px, gap 12px).
 *
 * Volgorde omgedraaid op 2026-08-13 (verzoek van de gebruiker): de fase is de kop, "wie er aan
 * de beurt is" de regel eronder. De fase bepaalt wat je op dit scherm ziet en is dus de titel
 * van de pagina; de naam is de toelichting daarbij, niet andersom.
 */
export function ActivePlayerBanner({ turnOfLabel, playerName, color, subtitle, stat }: ActivePlayerBannerProps) {
  return (
    <GlassPanel elevation="base" context="phone" padding="none" className="flex items-center gap-3 rounded-2xl px-3.5 py-[13px]">
      <ColorAvatar color={color} variant="banner" />
      <div className="min-w-0 flex-1">
        {/* Kop + secundaire regel in dezelfde twee stappen als StatHeaderCard (`text-h2` display
            boven `text-body` in `text-fg-muted`), zodat de twee kaarttypes op de telefoon dezelfde
            koptypografie delen.
            BEVINDING, opgelost (2026-08-13, gebruiker gescreenshot): de faseduiding stond in de
            solide spelerskleur (`color.hex`). Die waarden zijn getuned als vulkleur achter een
            avatar/gebied, niet als tekst op donker glas — groen en blauw waren vrijwel
            onleesbaar. Hiërarchie zit nu in opacity (`text-fg-muted` → de on-glass behandeling
            uit index.css), zoals ook de TV-tegenhanger in TurnStatusHeader het al deed. De
            spelerskleur blijft zichtbaar waar hij wél werkt: de avatar ernaast. */}
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
