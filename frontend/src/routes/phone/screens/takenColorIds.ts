import type { GameStateDto } from '../../../types/GameState'

/**
 * De bezette kleuren: het complement van de door de server geleverde `availableColorIds`.
 * Gedeeld tussen de join-stap vóór het joinen (`PhonePage`) en de lobby zelf
 * (`PhoneLobbyScreen`), zodat beide dezelfde lijst tonen.
 */
export const takenColorIds = (state: GameStateDto) =>
  state.colors.map((color) => color.id).filter((id) => !state.availableColorIds.includes(id))
