import { boardViewBox } from '../styles/design-tokens'
import { MAP_HEIGHT_PX } from './projection'

/**
 * Omrekenfactor van design-eenheden naar viewBox-eenheden van onze kaartlaag.
 *
 * De export tekent het bord in `viewBox="0 0 1500 790"` en legt de achtergrond daarin neer als
 * `<image x="0" y="0" width="1500" height="790" preserveAspectRatio="xMidYMid slice">`
 * (het oorspronkelijke TV-ontwerp gebruikte `viewBox="0 0 1500 790"`). `slice` schaalt met
 * `max(1500/4096, 790/2132)` = `max(0.3662, 0.3706)` — de hoogte bindt, en de breedte loopt
 * daar met dezelfde factor in mee: de achtergrond wordt 1517,75 eenheden breed en er valt links
 * en rechts 8,87 eenheid buiten beeld. Eén design-eenheid is dus `MAP_HEIGHT_PX / 790`
 * achtergrondpixels, ongeacht hoe breed de container op de TV uiteindelijk is.
 *
 * Zonder deze conversie belanden designmaten ongeschaald in een viewBox die ~2,7× groter is
 * en staan discs, legergetallen en gebiedslabels navenant te klein.
 */
export const DESIGN_UNIT_PX = MAP_HEIGHT_PX / boardViewBox.h

/** Zet een maat uit de design-viewBox (1500×790) om naar onze kaart-viewBox. */
export function designToMap(units: number): number {
  return units * DESIGN_UNIT_PX
}
