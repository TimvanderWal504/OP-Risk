import type { LocaleTree } from '../i18n/types'

/**
 * Verplaatsen (`TurnPhaseDto.Fortify`, FO §5.2), telefoonkant — de moderne variant: één vrije
 * verplaatsing over een pad van eigen gebieden, niet beperkt tot directe buren. Geen letterlijke
 * exportsectie (het oorspronkelijke design kende geen Fortify-fase, zie `frontend/CLAUDE.md`);
 * structuur en toon naar het voorbeeld van `attack.ts`.
 */
export const fortify = {
  armiesWord: { nl: 'legers', en: 'armies' },

  pickSrc: {
    title: { nl: 'Verplaats vanuit', en: 'Move from' },
    subtitle: { nl: 'Kies een van je gebieden om legers vanuit te verplaatsen.', en: 'Pick one of your territories to move armies from.' },
    empty: { nl: 'Je hebt geen gebied van waaruit je kunt verplaatsen.', en: 'You have no territory to move armies from.' },
    skipTurn: { nl: 'Beurt beëindigen', en: 'End turn' },
  },
  pickTgt: {
    title: { nl: 'Kies je doelgebied', en: 'Choose your target' },
    from: { nl: 'Vanuit', en: 'From' },
    back: { nl: 'Ander brongebied kiezen', en: 'Pick a different source' },
    empty: {
      nl: 'Er is nu geen geldig doelgebied vanuit dit brongebied.',
      en: 'There is no valid target territory from this source right now.',
    },
  },
  amount: {
    title: { nl: 'Hoeveel legers verplaats je?', en: 'How many armies do you move?' },
    back: { nl: 'Ander doelgebied kiezen', en: 'Pick a different target' },
    confirm: { nl: 'Bevestig verplaatsing', en: 'Confirm move' },
    minNote: {
      nl: "Er moet minimaal 1 leger achterblijven in '{{territory}}'.",
      en: "At least 1 army must stay behind in '{{territory}}'.",
    },
  },
  done: {
    confirmationWithDetail: {
      nl: 'Je hebt {{amount}} legers verplaatst van {{from}} naar {{to}}.',
      en: 'You moved {{amount}} armies from {{from}} to {{to}}.',
    },
    genericConfirmation: {
      nl: 'Je hebt deze beurt al verplaatst.',
      en: 'You have already moved this turn.',
    },
    endTurn: { nl: 'Beurt beëindigen', en: 'End turn' },
  },

  bystander: {
    subtitle: { nl: 'Verplaatsen', en: 'Fortify' },
  },
} satisfies LocaleTree
