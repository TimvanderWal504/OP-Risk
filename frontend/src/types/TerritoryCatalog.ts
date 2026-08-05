/**
 * Spiegelt RiskGame.Api.Dtos.TerritoryCatalogDto (src/RiskGame.Api/Dtos/GameStateDto.cs) —
 * continent + aangrenzende gebieden; de weergavenaam komt via `tDynamic(id, 'territories')`
 * (frontend/src/locales/territories.ts), nooit uit deze catalogus.
 */
export interface TerritoryCatalogDto {
  id: string
  continent: string
  neighborTerritoryIds: string[]
}
