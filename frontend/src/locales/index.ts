import { common } from './common'
import { errors } from './errors'
import { validation } from './validation'
import { home } from './home'
import { createGame } from './createGame'
import { join } from './join'
import { lobby } from './lobby'
import { setup } from './setup'
import { setupTv } from './setupTv'
import { orderRoll } from './orderRoll'
import { board } from './board'
import { reinforce } from './reinforce'
import { attack } from './attack'
import { attackTv } from './attackTv'
import { fortify } from './fortify'
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
  setupTv,
  orderRoll,
  board,
  reinforce,
  attack,
  attackTv,
  fortify,
  colors,
  roles,
  territories,
  continents,
  missions,
  events,
  cards,
  quotes,
} as const
