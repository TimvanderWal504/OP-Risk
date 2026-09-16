import type { LocaleTree } from '../i18n/types'

/**
 * Chrome-teksten voor de persistente "Mijn missie"-knop en het bijbehorende paneel op de
 * telefoon (FO §2, §6.1) — niet de missienaam/-omschrijving zelf, die staan al per missie-id
 * in `locales/missions.ts`, via `tDynamic`. Fase-onafhankelijk (`PhonePlayerHeader.tsx`), dus
 * geen eigen `GamePhaseDto`-schermregistratie.
 */
export const missionPanel = {
  buttonLabel: { nl: 'Mijn missie', en: 'My mission' },
  close: { nl: 'Sluiten', en: 'Close' },
  changedNotice: {
    nl: "Je missie is gewijzigd — bekijk 'm opnieuw.",
    en: 'Your mission has changed — take another look.',
  },
  secretLabel: { nl: 'Geheime missie', en: 'Secret mission' },
  visibleOnlyToYou: { nl: 'Alleen zichtbaar voor jou.', en: 'Only visible to you.' },
} satisfies LocaleTree
