import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PlayerAvatar } from './PlayerAvatar'
import { GlassPanel } from './GlassPanel'
import { CardsIcon, CrownIcon, InfoIcon, MissionIcon } from './icons'
import { glassBadgeBorder } from '../../styles/glass-tokens'

export interface PlayerHeaderAction {
  /** Een echt icoon-element (SVG), geen tekst-glyph — zie `icons.tsx`/DESIGN.md's emoji-verbod. */
  icon: ReactNode
  label: string
  onClick?: () => void
  /** Actief tabblad (bv. het open bottom-sheet-tabblad). */
  active?: boolean
  /**
   * Tabular-numeral teller in de hoek van het icoon (bv. handaantal op "Mijn kaarten") —
   * alleen zichtbaar bij `>= 1` (Invisible Design Rule): niets te melden bij 0 is geen badge,
   * geen "0". Geen tekst-suffix op `label` zelf: een teller in een label leest als onderdeel
   * van de naam, zie de "Mijn kaarten"-design-brief.
   */
  badgeCount?: number
  /** `'default'` (silver-outline) of `'warning'` (Caution Amber — de ene toegestane
   *  amber-toepassing, bv. een verplichte kaarteninleg). */
  badgeVariant?: 'default' | 'warning'
}

export interface PlayerHeaderProps {
  name: string
  colorName: string
  colorHex: string
  colorSymbol?: string | null
  colorOnHex?: string | null
  isHost?: boolean
  /** Beurt-status, bv. "Jouw beurt · Aanvallen". */
  status: string
  /** Reeds geformatteerde beurttimer, bv. "2:41" of "Gepauzeerd". `null` zolang de fase geen
   *  beurttimer kent (Claiming/InitialPlacement, TO §4.2/§9 — `TurnStateDto.timer` bestaat
   *  alleen tijdens InProgress): de hele Beurttijd-kolom blijft dan weg i.p.v. een lege waarde
   *  te tonen. */
  timer: string | null
  /** 'normal' (default): witte cijfers. 'low': rood, pulserend. 'paused': ❚❚-prefix. */
  timerState?: 'normal' | 'low' | 'paused'
  /** Overschrijft de standaard actieknoppen (Mijn kaarten / Mijn missie / Spelinfo). */
  actions?: PlayerHeaderAction[]
}

/** Speler-header op de telefoon: identiteit, beurt-status, beurttimer en
 * snelkoppelingen. Presentational — alle waarden komen via props (nu nog
 * placeholders tot het spelbord er is). */
export function PlayerHeader({
  name,
  colorName,
  colorHex,
  colorSymbol,
  colorOnHex,
  isHost = false,
  status,
  timer,
  timerState = 'normal',
  actions,
}: PlayerHeaderProps) {
  const { t } = useTranslation('common')
  const defaultActions: PlayerHeaderAction[] = [
    { icon: <CardsIcon className="h-[18px] w-[18px]" />, label: t('playerHeader.actions.cards') },
    { icon: <MissionIcon className="h-[18px] w-[18px]" />, label: t('playerHeader.actions.mission') },
    { icon: <InfoIcon className="h-[18px] w-[18px]" />, label: t('playerHeader.actions.info') },
  ]
  const resolvedActions = actions ?? defaultActions

  return (
    // `px-gutter`: `PlayerHeader` is een directe wortel onder `PhoneShell` (naast, niet binnen,
    // een `PhoneScreen`), en `PhoneShell` zelf draagt geen padding — zelfde contract als
    // `PhoneScreen.tsx`'s doc-comment voorschrijft voor de andere afwijkende wortels
    // (`DefendStep`, `CreateGameForm`): zonder eigen `*-gutter` zou deze kaart plat tegen de
    // schermrand vallen i.p.v. op dezelfde inspringing als de rest van het scherm.
    <div className="flex flex-col mt-4 px-gutter">
      <GlassPanel elevation="base" context="phone" padding="none" className="flex items-center gap-[11px] rounded-card px-3 py-2.5">
        <div className="relative flex-none">
          <PlayerAvatar colorHex={colorHex} colorOnHex={colorOnHex} colorSymbol={colorSymbol} />
          {isHost && (
            <span
              className="absolute -right-[5px] -bottom-[5px] flex h-5 w-5 items-center justify-center rounded-full bg-silver-400 text-ink-950"
              style={{ border: '2px solid var(--bg)' }}
              aria-label={t('playerHeader.hostBadge')}
            >
              <CrownIcon className="h-3 w-3" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {/* `text-h3` (17px, DESIGN.md-typeramp) i.p.v. het losstaande 19px ertussenin: de
              dichtstbijzijnde stap ("card titles"), passend bij deze compacte identiteitsrij.
              `· {colorName}` deelt nu het gewicht/formaat van de statusregel eronder (geen
              eigen `font-bold`) — één luid element (de naam), de rest wijkt uniform terug in
              opacity, niet in nog een eigen gewicht (zelfde principe als `ActivePlayerBanner`'s
              "hiërarchie zit in opacity, niet in tekstgewicht"-doc-comment). */}
          <div className="truncate font-display text-h3 font-extrabold">
            {name} <span className="text-sm text-fg-muted">· {colorName}</span>
          </div>
          <div className="mt-[3px] truncate text-sm text-fg-muted">{status}</div>
        </div>
        {timer !== null && (
          <div className="flex-none text-right">
            {/* `text-xs` (11px, DESIGN.md-typeramp — "meta, badge text") i.p.v. 9px: dat lag
                onder elke gedocumenteerde stap en onder wat vergelijkbare eyebrow-labels
                elders al gebruiken (bv. "GECLAIMD DOOR", "GEHEIME MISSIE" op 11px). */}
            <div className="font-body text-xs font-black tracking-[.14em] text-fg-muted uppercase">Beurttijd</div>
            {/* `text-h1` (28px, DESIGN.md-typeramp) i.p.v. het losstaande 26px — op gebruikers-
                verzoek aangepast; gewicht blijft `font-black` (900), niet de ramp's h1-gewicht
                (700): dat is dezelfde, aparte "hero-stat"-conventie als bv. `StatHeaderCard`'s
                34px-teller, ook `font-black` i.p.v. het koppen-gewicht. */}
            {timerState === 'normal' && (
              <div className="font-display text-h1 font-black text-fg tabular-nums">{timer}</div>
            )}
            {timerState === 'low' && (
              <div className="animate-timer-low font-display text-h1 font-black text-[#ff5257] tabular-nums">
                {timer}
              </div>
            )}
            {timerState === 'paused' && (
              <div className="pt-[5px] font-display text-body font-extrabold text-fg-muted">❚❚ {timer}</div>
            )}
          </div>
        )}
      </GlassPanel>

      <div className="mt-[9px] flex gap-[7px]">
        {resolvedActions.map((action) =>
          action.active ? (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="flex flex-1 flex-col items-center gap-1 rounded-[12px] border border-silver-600 bg-silver-400/12 px-1 py-2 text-xs font-bold text-silver-300"
            >
              <ActionIcon action={action} />
              {action.label}
            </button>
          ) : (
            <GlassPanel key={action.label} elevation="base" context="phone" padding="none" className="flex-1 rounded-[12px]">
              <button
                type="button"
                onClick={action.onClick}
                className="flex w-full flex-col items-center gap-1 px-1 py-2 text-xs font-bold text-fg-secondary"
              >
                <ActionIcon action={action} />
                {action.label}
              </button>
            </GlassPanel>
          ),
        )}
      </div>
    </div>
  )
}

/**
 * Icoon + optionele hoek-badge (bv. handaantal), gedeeld tussen de `active`- en
 * default-variant van een actieknop hierboven — anders zou de badge-opmaak op twee plekken
 * los herhaald moeten worden.
 */
function ActionIcon({ action }: { action: PlayerHeaderAction }) {
  const badgeCount = action.badgeCount ?? 0

  return (
    <span className="relative inline-flex">
      {action.icon}
      {badgeCount > 0 && (
        <span
          className={`absolute -top-1.5 -right-2 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-[3px] font-body text-size1 font-extrabold text-ink-950 tabular-nums ${
            action.badgeVariant === 'warning' ? 'bg-warning' : 'bg-silver-400'
          }`}
          style={{ border: `1px solid ${action.badgeVariant === 'warning' ? 'var(--warning)' : glassBadgeBorder}` }}
        >
          {badgeCount}
        </span>
      )}
    </span>
  )
}
