import type { LocaleTree } from '../i18n/types'

/** Gekeyed op backend-errorCode (Fase 3). Voorlopig alleen de generieke fallback. */
export const errors = {
  unknown: {
    nl: 'Er is iets misgegaan.',
    en: 'Something went wrong.',
  },
} satisfies LocaleTree
