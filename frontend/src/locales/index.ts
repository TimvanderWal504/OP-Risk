import { common } from './common'
import { errors } from './errors'
import { validation } from './validation'
import { home } from './home'
import { createGame } from './createGame'
import { join } from './join'
import { lobby } from './lobby'
import { orderRoll } from './orderRoll'
import { colors } from './colors'
import { roles } from './roles'

export const trees = {
  common,
  errors,
  validation,
  home,
  createGame,
  join,
  lobby,
  orderRoll,
  colors,
  roles,
} as const
