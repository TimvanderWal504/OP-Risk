import { useMemo } from 'react'
import type { PlayerColorDto, TerritoryDto } from '../types/GameState'
import type { PlayerDto } from '../types/Player'

export interface TerritoryOwnership {
  owned: TerritoryDto
  owner: PlayerDto | undefined
  color: PlayerColorDto | undefined
}

/**
 * Bouwt één keer per render een `Map<territoryId, ...>` op uit `territories`/`players`/
 * `colors`, i.p.v. de drie geketende `.find()`-aanroepen die `TvMainBoardScreen`,
 * `TvInitialPlacementScreen` en `TvClaimingScreen` elk twee keer per gebied deden (fill-
 * laag + marker-laag) — op de TV's zwakke GPU/CPU merkbaar bij elke `GameStateUpdated`.
 * Verandert niets aan de per-fase render-logica (own/vijand vs. geclaimd/vrij blijft
 * bewust per scherm anders), alleen de opzoeklaag erachter.
 */
export function useTerritoryOwnership(
  territories: TerritoryDto[],
  players: PlayerDto[],
  colors: PlayerColorDto[],
): Map<string, TerritoryOwnership> {
  return useMemo(() => {
    const playerById = new Map(players.map((player) => [player.id, player]))
    const colorById = new Map(colors.map((color) => [color.id, color]))
    const lookup = new Map<string, TerritoryOwnership>()

    for (const owned of territories) {
      const owner = owned.ownerPlayerId ? playerById.get(owned.ownerPlayerId) : undefined
      const color = owner?.colorId ? colorById.get(owner.colorId) : undefined
      lookup.set(owned.territoryId, { owned, owner, color })
    }

    return lookup
  }, [territories, players, colors])
}
