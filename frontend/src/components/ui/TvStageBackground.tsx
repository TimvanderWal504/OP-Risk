import { useState } from 'react'
import lobbyBattlefield from '../../styles/assets/lobby-battlefield.webp'
import { illustrationFocal, stageScrim, type StageScrimLevel } from '../../styles/glass-tokens'
import { tvAnimations } from '../../styles/motion'

export interface TvStageBackgroundProps {
  level: StageScrimLevel
}

interface ScrimLayer {
  id: number
  level: StageScrimLevel
}

/**
 * Persistente illustratie + gerichte scrim voor alle TV-routes, gemount in `TvShell` (dus
 * vóór/buiten het per-fase schermregister — zie TvPage.tsx). Blijft één keer gemount over
 * fasewissels heen: alleen het scrim-niveau verandert via `level`, de `<img>` zelf herrendert
 * nooit. Tokens/waarden/afleiding staan in `styles/glass-tokens.ts` — hier alleen de
 * crossfade-mechaniek.
 *
 * De illustratie krijgt bewust geen eigen filter/transform (TV-perfeis, frontend/CLAUDE.md
 * §Animatie: zwakke GPU, alleen transform/opacity, en zelfs dat spaarzaam) — alleen de scrim-
 * laag animeert, via `tvAnimations.overlayIn`/`overlayOut` (motion.ts C9-C11, ongewijzigd).
 */
export function TvStageBackground({ level }: TvStageBackgroundProps) {
  const [layers, setLayers] = useState<ScrimLayer[]>(() => [{ id: 0, level }])

  // Tijdens render vergelijken en bijwerken (geen effect) — zelfde patroon als
  // `useHeldPhase`/`TvMainBoardScreen` se `prevArmy`: een render die op een prop-wissel
  // reageert, geen bijwerking die om een effect vraagt. De nieuwe id leunt op de laatste
  // laag i.p.v. een ref-counter (react-hooks/refs staat geen ref-mutatie tijdens render
  // toe) — die laatste laag is altijd de huidige en wordt nooit verwijderd vóór een nieuwe
  // push, dus `id + 1` blijft uniek en oplopend.
  if (layers[layers.length - 1].level !== level) {
    const id = layers[layers.length - 1].id + 1
    setLayers((prev) => [...prev, { id, level }])
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={lobbyBattlefield}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: illustrationFocal }}
      />
      {layers.map((layer, index) => {
        const isCurrent = index === layers.length - 1
        return (
          <div
            key={layer.id}
            className="absolute inset-0"
            style={{
              background: stageScrim[layer.level],
              animation: isCurrent ? tvAnimations.overlayIn : tvAnimations.overlayOut,
            }}
            onAnimationEnd={
              isCurrent ? undefined : () => setLayers((prev) => prev.filter((entry) => entry.id !== layer.id))
            }
          />
        )
      })}
    </div>
  )
}
