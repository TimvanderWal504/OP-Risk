import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Leaf } from '../i18n/types'
import { missions } from './missions'

interface MissionData {
  id: string
  type: string
  params?: { count?: number; minArmies?: number }
}

const mapsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../data/maps')

/** Elke kaartvariant onder data/maps met zijn missieset (FO §4.5, §6.1). */
const missionsPerMap: [string, MissionData[]][] = readdirSync(mapsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const file = JSON.parse(readFileSync(resolve(mapsDir, entry.name, 'missions.json'), 'utf-8')) as {
      missions: MissionData[]
    }
    return [entry.name, file.missions]
  })

const texts = missions as Record<string, { name: Leaf; description: Leaf } | undefined>

/**
 * De drempel van een gebiedsaantal-missie staat in de data (`params.count`/`minArmies`) én
 * letterlijk in de vertaling per missie-ID. Deze test bewaakt dat die twee niet uit elkaar
 * lopen, en dat elke missie op elke kaart een tekst heeft.
 */
describe.each(missionsPerMap)('missies van %s', (_mapId, mapMissions) => {
  it.each(mapMissions.map((mission) => [mission.id, mission] as const))('%s heeft een vertaling', (id) => {
    expect(texts[id], `geen vertaling in locales/missions.ts voor '${id}'`).toBeDefined()
  })

  const countMissions = mapMissions.filter((mission) => mission.params?.count !== undefined)

  it.each(countMissions.map((mission) => [mission.id, mission] as const))(
    '%s noemt de drempels uit de data in elke tekst',
    (id, mission) => {
      const numbers = [mission.params?.count, mission.params?.minArmies].filter((n) => n !== undefined)
      const leaves = [texts[id]?.name, texts[id]?.description]

      for (const leaf of leaves) {
        for (const text of [leaf?.nl, leaf?.en]) {
          for (const n of numbers) {
            expect(text, `'${id}' noemt ${n} niet`).toMatch(new RegExp(`\\b${n}\\b`))
          }
        }
      }
    },
  )
})
