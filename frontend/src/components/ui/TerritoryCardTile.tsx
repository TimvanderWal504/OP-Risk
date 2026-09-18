import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { CardDto } from '../../types/Card'
import { GlassPanel } from './GlassPanel'
import { resolveCardTheme, type CardThemeId } from '../../config/resolveCardTheme'
import { tDynamic } from '../../i18n/useT'
import type { TerritoryOutline } from '../../map/loadTerritoryOutlines'
import {
  ArtillerieCardIcon,
  CavalerieCardIcon,
  DroneCardIcon,
  InfanterieCardIcon,
  PantserCardIcon,
} from './cardSymbolIcons'
import type { IconProps } from './icons'

export interface TerritoryCardTileProps {
  card: CardDto
  /** Of `card.territoryId` een gebied van de eigen speler is (FO §4.4, +2-bezitsbonus). */
  owned: boolean
  /** Genormaliseerde omlijning uit `useTerritoryOutlines`; `null` zolang die nog laadt. */
  outline: TerritoryOutline | null
}

type CardIconComponent = (props: IconProps) => ReturnType<typeof InfanterieCardIcon>

/**
 * Thema-bewuste opzoektabel (bugfix t.o.v. het in taak 5 gecommitte bestand, elite-code-review
 * 2026-09-17): `symbolLabel` liep al via `resolveCardTheme()`, maar het icoon zelf bleef een
 * platte `Record<symbol, Icon>` — onder `modern` zou symbol-2 ten onrechte het `classic`-icoon
 * (Cavalerie) tonen i.p.v. Pantser. `modern` is vandaag onbereikbaar (`resolveCardTheme()` geeft
 * altijd `'classic'` terug, geen lobby-instelling gebouwd) maar toch al volledig bedraad — zelfde
 * categorie vooruitbouwen als `resolveCardTheme()` zelf (interne structuur, geen DTO-veld, zie
 * CLAUDE.md's onderscheid tussen wire-contract en interne vorm).
 */
const CARD_SYMBOL_ICONS: Record<CardThemeId, Record<string, CardIconComponent>> = {
  classic: {
    'symbol-1': InfanterieCardIcon,
    'symbol-2': CavalerieCardIcon,
    'symbol-3': ArtillerieCardIcon,
  },
  modern: {
    'symbol-1': InfanterieCardIcon,
    'symbol-2': PantserCardIcon,
    'symbol-3': DroneCardIcon,
  },
}

const VALUE_SYMBOLS = ['symbol-1', 'symbol-2', 'symbol-3'] as const

/**
 * Eén van de 3 secties van de tegel. Gedeeld tussen de joker- en reguliere-kaart-inhoud zodat
 * beide altijd dezelfde buitenrand delen (`aspect-[3/4]`, `overflow-hidden`, ...) — vóór deze
 * refactor (2026-09-17) waren dat twee losse JSX-bomen die uit elkaar konden lopen: een latere
 * wijziging aan de reguliere tak liet de aspect-ratio-klasse daar per ongeluk vallen zonder dat
 * de joker-tak meeveranderde, wat de twee kaarttypes verschillend liet ogen in hetzelfde raster.
 */
function CardTilePart({
  flexClass,
  column = false,
  paddingClass = 'px-2 py-1',
  children,
}: {
  flexClass: string
  column?: boolean
  paddingClass?: string
  children: ReactNode
}) {
  return (
    <div className={`flex ${flexClass} items-center justify-center ${paddingClass}${column ? ' flex-col gap-1' : ''}`}>
      {children}
    </div>
  )
}

/**
 * Eén territoriumkaart, presentational (geen eigen selectie-state) — passief in het
 * hand-overzicht, of als `children` van `SelectableOption` in de inleg-stap (design-brief,
 * "Eén tegel, twee gebruiken"). Rendert binnen `CardsPanel`'s `ModalShell`, dus de
 * `GlassPanel` hieronder vervaagt flat via de no-nested-blur-guard (zelfde pad als
 * `MissionPanel`'s eigen `GlassPanel`).
 *
 * **3 gecentreerde delen, zonder scheidingslijnen** (herzien 2026-09-17 op gebruikersfeedback
 * over de eerste versie): (1) gebiedsnaam, (2) genormaliseerde omlijning
 * (`stroke=currentColor`/`fill=none`), (3) thema-bewust waarde-icoon + symboollabel — deze
 * volgorde (naam → omlijning → waarde) verving de eerdere waarde → naam → omlijning-indeling, en
 * de hairline-dividers tussen de delen zijn vervallen. Hoogte volgt de eigen inhoud (geen vaste
 * `aspect-[3/4]` meer — bewust verwijderd, 2026-09-18: de vaste verhouding werkte de UI tegen).
 * Deel 2 (omlijning) krijgt `flex-[2]` i.p.v. `flex-1` (op verzoek van de gebruiker,
 * 2026-09-17: "de kaarten iets te klein") — dubbel zoveel verticale ruimte als deel 1/3, en de
 * omlijning-svg zelf vult die ruimte volledig (geen `max-h`-cap meer). Een joker vervangt de
 * inhoud van alle 3 delen door de 3 waarde-iconen van het huidige thema (elk `flex-1`, geen
 * `flex-[2]` — er is geen "omlijning"-deel om te vergroten), plus een "Joker"-label onderaan de
 * kaart — geen gebiedsnaam, geen omlijning (jokers zijn nooit eigen gebied). Geen apart
 * bezitssignaal/tekst meer voor eigen gebieden (bewust verwijderd, 2026-09-18, zelfde reden als
 * de aspect-ratio) — de `owned`-prop stuurt nog wel de `--pitch-700`-randkleur. Joker en
 * reguliere kaart delen dezelfde `GlassPanel`/`CardTilePart`-structuur (zie de doc-comment
 * daar); alleen de inhoud per deel en de trailing-regel verschillen.
 */
export function TerritoryCardTile({ card, owned, outline }: TerritoryCardTileProps) {
  const { t } = useTranslation('cardsPanel')
  const theme = resolveCardTheme()
  const isJoker = card.symbol === 'joker'

  const Icon = CARD_SYMBOL_ICONS[theme][card.symbol] ?? InfanterieCardIcon
  const symbolLabel = tDynamic(`${theme}.${card.symbol}`, 'cards')
  const territoryLabel = card.territoryId ? tDynamic(card.territoryId, 'territories') : t('jokerLabel')
  const territoryOutline = card.territoryId ? outline : null
  const [JokerIcon1, JokerIcon2, JokerIcon3] = VALUE_SYMBOLS.map((symbol) => CARD_SYMBOL_ICONS[theme][symbol])

  return (
    <GlassPanel
      elevation="raised"
      context="phone"
      padding="none"
      className="flex flex-col overflow-hidden text-center"
      style={owned ? { borderColor: 'var(--pitch-700)' } : undefined}
    >
      <CardTilePart flexClass="flex-1" paddingClass="px-2 py-4">
        {isJoker ? (
          <JokerIcon1 className="h-24 w-24 text-fg" />
        ) : (
          <span className="font-display text-h3 font-semibold text-fg">{territoryLabel}</span>
        )}
      </CardTilePart>

      <CardTilePart flexClass={isJoker ? 'flex-1' : 'flex-[2]'}>
        {isJoker ? (
          <JokerIcon2 className="h-24 w-24 text-fg" />
        ) : (
          territoryOutline && (
            <svg
              aria-hidden
              viewBox={territoryOutline.viewBox}
              className="h-full w-full text-fg"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinejoin="round"
            >
              <path d={territoryOutline.pathD} />
            </svg>
          )
        )}
      </CardTilePart>

      <CardTilePart flexClass="flex-1" column={!isJoker}>
        {isJoker ? (
          <JokerIcon3 className="h-24 w-24 text-fg" />
        ) : (
          <>
            <Icon className="h-24 w-24 text-fg" />
            <span className="font-body text-xs font-extrabold tracking-[.12em] text-fg-muted uppercase">
              {symbolLabel}
            </span>
          </>
        )}
      </CardTilePart>

      {isJoker && (
        <span className="pb-1.5 font-body text-xs font-extrabold tracking-[.12em] text-fg-muted uppercase">
          {t('jokerLabel')}
        </span>
      )}
    </GlassPanel>
  )
}
