/**
 * Poort van `files/build_silhouette_v4.py` (CLAUDE.md, kaart-projectie-regel): dezelfde formule
 * als waarmee `map-background-final.png` is gegenereerd, anders vallen klikvlakken en achtergrond
 * uit elkaar (TO §7.2). De vier venstergrenzen zijn sinds 2026-08-03 gefit op de daadwerkelijke
 * asset in plaats van 1-op-1 overgenomen uit het script — zie de toelichting bij `LON_MIN` en
 * TO §7.2. Wijzigt de asset, dan is die fit aan herhaling toe.
 *
 * `build_silhouette_v4.py:7` noemt de generatiecanvas 1920×1000, maar het daadwerkelijk in de
 * repo opgeslagen `map-background-final.png` was dat al vóór dit bestand bestond nooit exact
 * (753f45b: 1414×736) en is later herexporteerd naar 4096×2132 (f67d96b, "resize map") — in
 * beide gevallen een zuivere uniforme schaal van dezelfde framing (aspect ≈1.9212, geverifieerd
 * tegen de git-geschiedenis van het bestand). `MAP_WIDTH_PX`/`MAP_HEIGHT_PX` volgen daarom de
 * daadwerkelijke pixelgrootte van het huidige bestand, niet het nominale canvas uit het
 * Python-script — anders wijkt de SVG-viewBox-aspect net genoeg af van het bestand om
 * `TvMainBoardScreen`'s dimensiecontrole te laten afgaan.
 */

/** Daadwerkelijke breedte van `data/maps/standaard-43/map-background-final.png`. */
export const MAP_WIDTH_PX = 4096
/** Daadwerkelijke hoogte van `data/maps/standaard-43/map-background-final.png`. */
export const MAP_HEIGHT_PX = 2132
/**
 * `build_silhouette_v4.py:8` — bewust niet het standaard -180/180-bereik, zie TO §7.2.
 *
 * De grenzen zijn hier gefit op de daadwerkelijke `map-background-final.png`
 * (IoU-grid-search over het venster, zie TO §7.2): dit is het codeplafond na de
 * asset-wissel van 2026-08-03, niet meer de nominale -180/191 uit het Python-script.
 * Elke wijziging aan het bestand vraagt om een herhaling van die meting.
 */
export const LON_MIN = -180.5
export const LON_MAX = 192
export const LAT_MAX = 88.5
export const LAT_MIN = -88.5

export interface ProjectedPoint {
  x: number
  y: number
}

/** `build_silhouette_v4.py:10-11`, geparametriseerd op het gefitte venster (zie boven). */
export function project(lon: number, lat: number): ProjectedPoint {
  return {
    x: ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * MAP_WIDTH_PX,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_HEIGHT_PX,
  }
}

export type LonLat = [lon: number, lat: number]

/**
 * `build_silhouette_v4.py:17-27`. Vouwt het uiterste noordoosten van Rusland (negatieve
 * lengtegraad door de datumgrens) naar +360° zodat het rechts aan het vasteland plakt i.p.v.
 * los te vallen aan de andere kant van het canvas.
 */
export function shiftRingForKamchatka(ring: readonly LonLat[]): LonLat[] {
  const lons = ring.map(([lon]) => lon)
  const hasNeg = lons.some((lon) => lon < -150)
  const hasPos = lons.some((lon) => lon > 150)

  if (hasNeg && hasPos) {
    return ring.map(([lon, lat]) => [lon < 0 ? lon + 360 : lon, lat])
  }

  if (lons.every((lon) => lon < 0)) {
    return ring.map(([lon, lat]) => [lon + 360, lat])
  }

  return [...ring]
}

/** `build_silhouette_v4.py:29-30` — `.1f`-afronding van de bron letterlijk overgenomen. */
export function ringToPath(ring: readonly LonLat[]): string {
  const points = ring
    .map(([lon, lat]) => {
      const { x, y } = project(lon, lat)

      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' L ')

  return `M ${points} Z`
}
