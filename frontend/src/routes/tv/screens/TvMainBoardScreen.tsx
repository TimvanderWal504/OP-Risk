import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { tDynamic } from '../../../i18n/useT'
import { TurnStatusHeader } from '../../../components/board/TurnStatusHeader'
import { useTerritoryGeometry } from '../../../hooks/useTerritoryGeometry'
import { MAP_HEIGHT_PX, MAP_WIDTH_PX } from '../../../map/projection'
import { DESIGN_UNIT_PX, designToMap } from '../../../map/boardScale'
import { atlasRoughTok, boardMarkerTok, boardTok } from '../../../design-reference/shared/design-tokens'
import { tvAnimations } from '../../../design-reference/shared/motion'
import type { TvScreenProps } from './tvScreens'

const MAP_ID = 'standaard-43'

/**
 * Randdikte van een gebied zonder eigenaar, in design-eenheden. De export kent geen neutrale
 * gebieden — `sw` is daar `isOwn ? tok.ownSw : tok.enSw` — dus dit is geen exportwaarde maar
 * een op 2026-08-03 met de gebruiker afgesproken keuze; zie de afwijkingenlijst in
 * frontend/CLAUDE.md. `boardTok.neuStroke` is nadrukkelijk géén dikte maar een opacity,
 * naast `ownStroke`/`enStroke`.
 */
const NEUTRAL_STROKE_DESIGN_UNITS = 1.25

/** Alle markermaten uit `boardMarkerTok`, één keer omgerekend naar onze viewBox. */
const marker = {
  discR: designToMap(boardMarkerTok.discR),
  ringSwOwn: designToMap(boardMarkerTok.ringSwOwn),
  ringSwEnemy: designToMap(boardMarkerTok.ringSwEnemy),
  armyFontSize: designToMap(boardMarkerTok.armyFontSize),
  nameOffsetY: designToMap(boardMarkerTok.nameOffsetY),
  nameFontSize: designToMap(boardMarkerTok.nameFontSize),
  nameStrokeWidth: designToMap(boardMarkerTok.nameStrokeWidth),
} as const

/** Randdikte van de gebiedspolygonen, idem omgerekend. */
const territoryStroke = {
  own: designToMap(boardTok.ownSw),
  enemy: designToMap(boardTok.enSw),
  neutral: designToMap(NEUTRAL_STROKE_DESIGN_UNITS),
} as const

/**
 * `atlasRoughTok` omgerekend naar onze viewBox. `scale` is een verplaatsing in
 * viewBox-eenheden en gaat via `designToMap` mee met de rest van de kaart; `baseFrequency`
 * is cycli per eenheid en schaalt daarom omgekeerd (grotere eenheden op onze grotere
 * viewBox → lagere frequentie nodig voor dezelfde ruwheid per schermpixel).
 */
const atlasRough = {
  baseFrequency: atlasRoughTok.baseFrequency / DESIGN_UNIT_PX,
  numOctaves: atlasRoughTok.numOctaves,
  seed: atlasRoughTok.seed,
  scale: designToMap(atlasRoughTok.scale),
} as const

/**
 * Vangnet voor TO §7.2: `projection.ts` gaat uit van een vaste achtergrondgrootte
 * (`MAP_WIDTH_PX`×`MAP_HEIGHT_PX`, momenteel 4096×2132 — zie projection.ts voor waarom dat niet
 * het nominale 1920×1000-canvas uit `build_silhouette_v4.py` is). Een toekomstige asset-vervanging
 * op dezelfde url die niet aan die afmeting voldoet, zou de SVG-overlay stilzwijgend laten
 * verschuiven t.o.v. de kustlijn — dit meldt dat hardop i.p.v. het pas maanden later als "de
 * kaart staat een beetje scheef" te ontdekken.
 */
function checkBackgroundDimensions(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget
  if (img.naturalWidth !== MAP_WIDTH_PX || img.naturalHeight !== MAP_HEIGHT_PX) {
    console.error(
      `Kaartachtergrond heeft onverwachte afmetingen (${img.naturalWidth}x${img.naturalHeight}, verwacht ${MAP_WIDTH_PX}x${MAP_HEIGHT_PX}) — projection.ts en de PNG lopen niet meer synchroon (TO §7.2).`,
    )
  }
}

/**
 * TV-hoofdbord tijdens `GamePhaseDto.InProgress` (Host-scherm.dc.html, state "Main board",
 * `isBoard`-tak L257-312). Read-only weergave (FO §7.3/§2.3: de telefoon is de enige
 * invoerbron) — geen `onClick` op de gebiedslagen. Selectie-/gevechtsringen (z-3) horen bij
 * Attack en zijn hier bewust niet gebouwd; idem het spelerspaneel en de gebeurtenis-feed
 * (rechterkolom/onderrand in de export) — geen deliverable in het goedgekeurde plan voor deze
 * taak, en voor de feed bestaat sowieso nog geen server-databron.
 */
export function TvMainBoardScreen({ state }: TvScreenProps) {
  const { data: geometry } = useTerritoryGeometry()

  // Legeraantal van de vórige render, om per gebied de telrichting (op/neer) te bepalen
  // voor de A1-teldemo-animatie (Host-scherm.dc.html:642-675). Bijgewerkt tijdens render
  // (niet via een ref of effect, react-hooks/refs staat geen ref-mutatie tijdens render toe):
  // zelfde "vergelijk en pas aan"-patroon als `useHeldPhase.ts`.
  const [prevArmy, setPrevArmy] = useState<Record<string, number>>({})
  const currentArmy: Record<string, number> = {}
  state.territories.forEach((territory) => {
    currentArmy[territory.territoryId] = territory.armyCount
  })
  const armyChanged =
    Object.keys(currentArmy).length !== Object.keys(prevArmy).length ||
    Object.entries(currentArmy).some(([territoryId, armyCount]) => prevArmy[territoryId] !== armyCount)
  if (armyChanged) {
    setPrevArmy(currentArmy)
  }

  const turnState = state.turnState
  const activePlayer = state.players.find((p) => p.id === turnState?.activePlayerId)
  if (!turnState || !activePlayer) return null

  const activeColor = state.colors.find((c) => c.id === activePlayer.colorId)

  return (
    <div className="absolute inset-0 grid grid-cols-[1fr_402px] grid-rows-[96px_1fr_146px] gap-4 gap-x-6.5 p-6 px-6.5">
      <TurnStatusHeader
        activePlayer={activePlayer}
        activeColor={activeColor}
        turnPhase={turnState.turnPhase}
        timer={turnState.timer}
      />

      <div
        className="relative col-start-1 row-start-2 min-w-0 overflow-hidden rounded-[14px] border border-[var(--atlas-map-border)] bg-[var(--atlas-map-bg)]"
        style={{ boxShadow: 'inset 0 0 120px rgba(0,0,0,.75), inset 0 0 0 3px rgba(120,96,56,.18)' }}
      >
        <img
          src={`/maps/${MAP_ID}/map-background.png`}
          onLoad={checkBackgroundDimensions}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <svg
          viewBox={`0 0 ${MAP_WIDTH_PX} ${MAP_HEIGHT_PX}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <filter id="atlasRough">
              <feTurbulence
                type="fractalNoise"
                baseFrequency={atlasRough.baseFrequency}
                numOctaves={atlasRough.numOctaves}
                seed={atlasRough.seed}
                result="n"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="n"
                scale={atlasRough.scale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>

          <g filter="url(#atlasRough)">
            {geometry?.map((territory) => {
              const owned = state.territories.find((t) => t.territoryId === territory.id)
              const owner = state.players.find((p) => p.id === owned?.ownerPlayerId)
              const color = state.colors.find((c) => c.id === owner?.colorId)
              const isOwn = owner?.id === activePlayer.id
              const fillHex = color?.hex ?? boardTok.neutral
              const fillOpacity = color ? (isOwn ? boardTok.ownFill : boardTok.enFill) : boardTok.neuFill
              const strokeOpacity = color ? (isOwn ? boardTok.ownStroke : boardTok.enStroke) : boardTok.neuStroke
              const strokeWidth = color
                ? isOwn
                  ? territoryStroke.own
                  : territoryStroke.enemy
                : territoryStroke.neutral

              return (
                <path
                  key={territory.id}
                  d={territory.pathD}
                  fill={fillHex}
                  fillOpacity={fillOpacity}
                  stroke={fillHex}
                  strokeOpacity={strokeOpacity}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                />
              )
            })}
          </g>

          {geometry?.map((territory) => {
            const owned = state.territories.find((t) => t.territoryId === territory.id)
            if (!owned) return null

            const owner = state.players.find((p) => p.id === owned.ownerPlayerId)
            const color = state.colors.find((c) => c.id === owner?.colorId)
            const ringColor = color?.hex ?? boardTok.neutral
            // Host-scherm.dc.html:995 — `ringSw = isOwn ? 1.5 : 1.25`; de derde tak (1.75) hoort
            // bij de nog niet gebouwde selectiestaat.
            const ringSw = owner?.id === activePlayer.id ? marker.ringSwOwn : marker.ringSwEnemy

            const wasArmy = prevArmy[territory.id]
            const dir = wasArmy !== undefined && wasArmy !== owned.armyCount ? (owned.armyCount > wasArmy ? 1 : -1) : 0

            return (
              <g key={territory.id}>
                <circle
                  cx={territory.centroidPx.x}
                  cy={territory.centroidPx.y}
                  r={marker.discR}
                  fill={boardTok.disc}
                  fillOpacity={boardTok.discOp}
                  stroke={ringColor}
                  strokeWidth={ringSw}
                />
                <text
                  x={territory.centroidPx.x}
                  y={territory.centroidPx.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="Archivo, sans-serif"
                  fontWeight={700}
                  fontSize={marker.armyFontSize}
                  fill={boardTok.numFg}
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    animation: dir !== 0 ? tvAnimations.countTick(dir) : 'none',
                  }}
                >
                  {owned.armyCount}
                </text>
                <text
                  x={territory.centroidPx.x}
                  y={territory.centroidPx.y + marker.nameOffsetY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="Archivo, sans-serif"
                  fontWeight={700}
                  fontSize={marker.nameFontSize}
                  fill={boardTok.numFg}
                  stroke={boardTok.disc}
                  strokeWidth={marker.nameStrokeWidth}
                  strokeOpacity={boardMarkerTok.nameStrokeOpacity}
                  strokeLinejoin="round"
                  style={{ paintOrder: 'stroke', letterSpacing: '.01em' }}
                >
                  {tDynamic(territory.id, 'territories')}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
