import { useState } from 'react'
import phoneBattlefield from '../../styles/assets/phone-battlefield.webp'
import { phoneIllustrationFocal, stageScrim, type StageScrimLevel } from '../../styles/glass-tokens'
import { tvAnimations } from '../../styles/motion'

export interface PhoneStageBackgroundProps {
  level: StageScrimLevel
}

interface ScrimLayer {
  id: number
  level: StageScrimLevel
}

/**
 * Telefoon-tegenhanger van `TvStageBackground.tsx` — zelfde mechaniek (persistente
 * illustratie, gemount in `PhoneShell` dus vóór/buiten het per-fase schermregister; alleen
 * het scrim-niveau crossfade't bij een fasewissel, de `<img>` zelf herrendert nooit). Bewust
 * hergebruikt i.p.v. gefork: `stageScrim`/`StageScrimLevel` zijn al device-neutraal (zie
 * glass-tokens.ts) en de crossfade-animatie (`tvAnimations.overlayIn`/`overlayOut`) is zelf
 * ook al alleen `opacity` — er is geen telefoon-specifieke reden om een eigen keyframe te
 * verzinnen enkel om 'm anders te noemen. `frontend/CLAUDE.md`'s "telefoon wisselt schermen
 * instant"-regel gaat over het per-fase SCHERM (het schermregister in `phoneScreens.ts`), niet
 * over deze persistente achtergrondlaag daarachter — die twee zijn hier expliciet losgekoppeld,
 * exact zoals op TV (waar de scrim ook los van elk scherm crossfade't).
 *
 * Geen eigen filter/transform op de `<img>` zelf, zelfde reden als de TV-versie: de telefoon
 * heeft weliswaar geen "zwakke GPU"-eis (dat is specifiek een TV-beperking, zie PRODUCT.md),
 * maar wél een `backdrop-filter`-stapelingskost (frontend/CLAUDE.md §Mobiele randvoorwaarden) —
 * een extra bewegend/filterend laagje op de achtergrond zelf zou die stapeling verder verzwaren
 * zonder functie.
 */
export function PhoneStageBackground({ level }: PhoneStageBackgroundProps) {
  const [layers, setLayers] = useState<ScrimLayer[]>(() => [{ id: 0, level }])

  // Zelfde patroon als TvStageBackground.tsx: de nieuwe id leunt op de laatste laag i.p.v.
  // een ref-counter (react-hooks/refs staat geen ref-mutatie tijdens render toe) — die laatste
  // laag is altijd de huidige en wordt nooit verwijderd vóór een nieuwe push, dus `id + 1`
  // blijft uniek en oplopend.
  if (layers[layers.length - 1].level !== level) {
    const id = layers[layers.length - 1].id + 1
    setLayers((prev) => [...prev, { id, level }])
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={phoneBattlefield}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: phoneIllustrationFocal }}
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
