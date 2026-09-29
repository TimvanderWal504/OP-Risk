import { describe, expect, it } from 'vitest'
import { GamePhaseDto, TurnPhaseDto } from '../../../types/GameState'
import { resolvePhoneHeaderStatus } from './resolvePhoneHeaderStatus'

describe('resolvePhoneHeaderStatus', () => {
  it('geeft claiming voor GamePhaseDto.Claiming', () => {
    expect(resolvePhoneHeaderStatus(GamePhaseDto.Claiming, null)).toBe('claiming')
  })

  it('geeft placingArmies voor GamePhaseDto.InitialPlacement', () => {
    expect(resolvePhoneHeaderStatus(GamePhaseDto.InitialPlacement, null)).toBe('placingArmies')
  })

  it('geeft de juiste id per TurnPhaseDto tijdens InProgress', () => {
    expect(resolvePhoneHeaderStatus(GamePhaseDto.InProgress, TurnPhaseDto.Reinforce)).toBe('reinforce')
    expect(resolvePhoneHeaderStatus(GamePhaseDto.InProgress, TurnPhaseDto.Attack)).toBe('attack')
    expect(resolvePhoneHeaderStatus(GamePhaseDto.InProgress, TurnPhaseDto.Fortify)).toBe('fortify')
  })

  it('geeft null tijdens InProgress zolang turnPhase nog onbekend is', () => {
    expect(resolvePhoneHeaderStatus(GamePhaseDto.InProgress, null)).toBeNull()
  })

  /** Tijdens "Legers verwijderen" loopt er geen beurt, maar Spelinfo moet bereikbaar blijven (FO §9.2). */
  it('geeft attrition tijdens InProgress zonder beurt terwijl er legers verwijderd worden', () => {
    expect(resolvePhoneHeaderStatus(GamePhaseDto.InProgress, null, true)).toBe('attrition')
    expect(resolvePhoneHeaderStatus(GamePhaseDto.Lobby, null, true)).toBeNull()
  })

  it('geeft null voor fases zonder persistente header (Lobby/OrderRoll/Finished)', () => {
    expect(resolvePhoneHeaderStatus(GamePhaseDto.Lobby, null)).toBeNull()
    expect(resolvePhoneHeaderStatus(GamePhaseDto.OrderRoll, null)).toBeNull()
    expect(resolvePhoneHeaderStatus(GamePhaseDto.Finished, null)).toBeNull()
  })
})
