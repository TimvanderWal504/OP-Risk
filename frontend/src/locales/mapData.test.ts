import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { continents } from './continents'
import { maps } from './maps'
import { territories } from './territories'

const mapsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../data/maps')

function readJson<T>(mapId: string, fileName: string): T {
  return JSON.parse(readFileSync(resolve(mapsDir, mapId, fileName), 'utf-8')) as T
}

/** Elke kaartvariant onder data/maps die het spel kan laden (FO §4.5). */
const mapIds = readdirSync(mapsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

/**
 * De weergavenamen staan in de vertalingen, de ID's in de speeldata. Zonder deze test kan een
 * nieuwe kaart of een nieuw gebied landen zonder tekst — dan toont het spel een kale sleutel.
 */
describe.each(mapIds)('vertalingen voor kaart %s', (mapId) => {
  it('heeft een naam en omschrijving voor de kaart zelf', () => {
    expect(Object.keys(maps)).toContain(mapId)
  })

  it('heeft een naam voor elk gebied', () => {
    const ids = readJson<{ id: string }[]>(mapId, 'territories.json').map((territory) => territory.id)

    expect(ids.filter((id) => !(id in territories))).toEqual([])
  })

  it('heeft een naam voor elk continent', () => {
    const ids = readJson<{ continents: { id: string }[] }>(mapId, 'continents.json').continents.map((c) => c.id)

    expect(ids.filter((id) => !(id in continents))).toEqual([])
  })
})
