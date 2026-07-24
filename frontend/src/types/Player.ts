/** Spiegelt RiskGame.Api.Dtos.PlayerDto (src/RiskGame.Api/Dtos/PlayerDto.cs) 1-op-1. */
export interface PlayerDto {
  id: string
  name: string
  colorId: string | null
  roleId: string | null
  isHost: boolean
  isEliminated: boolean
}
