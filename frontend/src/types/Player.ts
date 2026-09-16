/** Spiegelt RiskGame.Api.Dtos.PlayerDto (src/RiskGame.Api/Dtos/PlayerDto.cs) 1-op-1.
 *  `hand` blijft bewust buiten dit type: geen scherm consumeert het vandaag (geen
 *  kaart-trekken-bij-verovering gebouwd, dus altijd leeg over de draad). */
export interface PlayerDto {
  id: string
  name: string
  colorId: string | null
  roleId: string | null
  isHost: boolean
  isEliminated: boolean
  /** Alleen gevuld voor de ontvangende speler zelf, en voor iedereen zodra
   *  `GameStateDto.phase === Finished` (missie-onthulling, FO §7). Null daarbuiten. */
  missionId: string | null
}
