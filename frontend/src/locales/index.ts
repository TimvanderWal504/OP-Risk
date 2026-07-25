import { common } from './common'
import { errors } from './errors'
import { validation } from './validation'
import { home } from './home'
import { createGame } from './createGame'
import { join } from './join'

export const trees = {
  common,
  errors,
  validation,
  home,
  createGame,
  join,
} as const
