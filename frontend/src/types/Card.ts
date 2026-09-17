/**
 * Spiegelt RiskGame.Api.Dtos.CardDto — een territoriumkaart of joker (`territoryId === null`).
 * Alleen gevuld op `PlayerDto.hand` voor de speler die 'm zelf mag zien (TO §6.1); voor elke
 * andere speler/de TV komt een lege array over de draad, nooit gevulde kaarten van iemand
 * anders (zie `GameStateDtoMapper.RedactForTv`/`RedactForPlayer`). Eigen bestand i.p.v. in
 * `GameState.ts` of `Player.ts`: beide importeren dit type, en `Player.ts` wordt zelf ook door
 * `GameState.ts` geïmporteerd — een derde, gedeelde plek voorkomt een circulaire import.
 */
export interface CardDto {
  id: string
  territoryId: string | null
  symbol: string
}
