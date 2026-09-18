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
  /** Of er ergens in `hand` een geldige inlegset zit (FO §4.4, drie gelijke of drie
   *  verschillende symbolen, joker als wildcard) — server-berekend zodat de telefoon de
   *  "Leg kaarten in"-knop kan tonen zonder de setregels zelf na te bouwen
   *  (frontend/CLAUDE.md). Zelfde privacy-grens als `hand`: `false` voor elke andere
   *  speler/de TV, ongeacht de werkelijke hand. */
  hasTradeableCardSet: boolean
  /** Aantal kaarten in de hand — anders dan `hand`/`hasTradeableCardSet` bewust publiek
   *  (FO §7: "Hand-aantal van elke speler is publiek, de kaarten zelf niet"), dus altijd
   *  correct gevuld, ook voor andere spelers en de TV. */
  handCount: number
  /** Alleen gevuld voor de ontvangende speler zelf, en voor iedereen zodra
   *  `GameStateDto.phase === Finished` (missie-onthulling, FO §7). Null daarbuiten. */
  missionId: string | null
}
