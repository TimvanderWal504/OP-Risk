import type { LocaleTree } from '../i18n/types'

/**
 * De gebeurtenisronde op de telefoon (DESIGN.md § Event Round): de korte melding bij een getrokken
 * kaart, het scherm "Legers verwijderen", het wachtscherm en de kaart in Spelinfo → Stand. Naam en
 * omschrijving van een kaart komen uit `events.ts`.
 */
export const eventPhone = {
  /** Fasenaam in de header terwijl er legers verwijderd worden (er loopt dan geen beurt). */
  status: { nl: 'Legers verwijderen', en: 'Removing armies' },
  notice: { nl: 'Gebeurteniskaart: {{event}}', en: 'Event card: {{event}}' },
  remove: {
    title_one: { nl: 'Verwijder {{count}} leger', en: 'Remove {{count}} army' },
    title_other: { nl: 'Verwijder {{count}} legers', en: 'Remove {{count}} armies' },
    left: { nl: 'te verwijderen', en: 'to remove' },
    unavailable_one: {
      nl: '{{count}} gebied met 1 leger kan niets missen.',
      en: '{{count}} territory with 1 army can spare none.',
    },
    unavailable_other: {
      nl: '{{count}} gebieden met 1 leger kunnen niets missen.',
      en: '{{count}} territories with 1 army can spare none.',
    },
    confirm: { nl: 'Bevestigen', en: 'Confirm' },
    // Toegankelijke namen van de stepper: hier haalt `−` weg en zet `+` terug.
    removeOne: { nl: 'Leger weghalen van {{territory}}', en: 'Remove an army from {{territory}}' },
    restoreOne: { nl: 'Leger terugzetten op {{territory}}', en: 'Put an army back on {{territory}}' },
  },
  wait: {
    removed_one: { nl: 'Je hebt {{count}} leger verwijderd.', en: 'You removed {{count}} army.' },
    removed_other: { nl: 'Je hebt {{count}} legers verwijderd.', en: 'You removed {{count}} armies.' },
    // Nooit "hoeft niets": wie legers kán missen, moet ze afstaan (besluit gebruiker 2026-09-29).
    nothingToSpare: {
      nl: 'Je hebt geen legers om te verwijderen: al je gebieden hebben 1 leger.',
      en: 'You have no armies to remove: all your territories hold 1 army.',
    },
    waitingFor: { nl: 'Wachten op {{names}}…', en: 'Waiting for {{names}}…' },
  },
  stand: {
    title: { nl: 'Gebeurteniskaart', en: 'Event card' },
  },
} satisfies LocaleTree
