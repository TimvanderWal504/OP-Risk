import type { CardDto } from './Card'

/** Spiegelt RiskGame.Api.Dtos.PlayerDto (src/RiskGame.Api/Dtos/PlayerDto.cs) 1-op-1. */
export interface PlayerDto {
  id: string
  name: string
  colorId: string | null
  roleId: string | null
  isHost: boolean
  isEliminated: boolean
  /** Alleen gevuld voor de ontvangende speler zelf (TO §6.1); voor elke andere speler/de TV
   *  komt hier een lege array over de draad, ongeacht de werkelijke handgrootte. */
  hand: CardDto[]
  /** Alleen gevuld voor de ontvangende speler zelf, en voor iedereen zodra
   *  `GameStateDto.phase === Finished` (missie-onthulling, FO §7). Null daarbuiten. */
  missionId: string | null
}
