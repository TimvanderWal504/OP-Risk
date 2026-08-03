import { common } from './common'
import { errors } from './errors'
import { validation } from './validation'
import { home } from './home'
import { createGame } from './createGame'
import { join } from './join'
import { lobby } from './lobby'
import { setup } from './setup'
import { orderRoll } from './orderRoll'
import { board } from './board'
import { reinforce } from './reinforce'
import { colors } from './colors'
import { roles } from './roles'
import { territories } from './territories'
import { continents } from './continents'
import { missions } from './missions'
import { events } from './events'
import { cards } from './cards'
import { quotes } from './quotes'

export const trees = {
  common,
  errors,
  validation,
  home,
  createGame,
  join,
  lobby,
  setup,
  orderRoll,
  board,
  reinforce,
  colors,
  roles,
  territories,
  continents,
  missions,
  events,
  cards,
  quotes,
} as const
