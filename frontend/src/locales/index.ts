import { common } from './common'
import { errors } from './errors'
import { validation } from './validation'
import { home } from './home'
import { createGame } from './createGame'

export const trees = {
  common,
  errors,
  validation,
  home,
  createGame,
} as const
