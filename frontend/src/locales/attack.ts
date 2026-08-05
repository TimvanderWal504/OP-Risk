import type { LocaleTree } from '../i18n/types'

/**
 * Aanvallen (`TurnPhaseDto.Attack`, FO §5.3), telefoonkant. Bron:
 * het oorspronkelijke telefoon-design se `isAttack`/`isConquest`-fasen,
 * L964-997 (`isDefend`) en L1005-1013 (`isElim`). De reroll-blok (Generaal-rol, L617-635) en de
 * "Kaarteninleg"/kaart-trek-tekst ontbreken bewust — buiten scope van deze taak, zie het
 * Attack-bouwplan.
 */
export const attack = {
  armiesWord: { nl: 'legers', en: 'armies' },
  targetsWord: { nl: 'doelen', en: 'targets' },
  resultShort: { nl: 'Uitkomst', en: 'Result' },
  detailsOnTv: { nl: 'Details op de TV', en: 'Details on the TV' },

  pickSrc: {
    title: { nl: 'Aanvallen vanuit', en: 'Attack from' },
    subtitle: { nl: 'Kies een van je gebieden dat kan aanvallen.', en: 'Pick one of your territories that can attack.' },
    empty: { nl: 'Geen van je gebieden kan nu aanvallen.', en: 'None of your territories can attack right now.' },
  },
  pickTgt: {
    title: { nl: 'Kies je doelwit', en: 'Choose your target' },
    from: { nl: 'Vanuit', en: 'From' },
  },
  pickDice: {
    title: { nl: 'Hoeveel dobbelstenen?', en: 'How many dice?' },
    hint: {
      nl: 'Max {{max}} — je hebt {{armies}} legers in {{territory}} (1 blijft altijd staan).',
      en: 'Max {{max}} — you have {{armies}} armies in {{territory}} (1 always stays).',
    },
    diceWord1: { nl: 'dobbelsteen', en: 'die' },
    diceWord2: { nl: 'dobbelstenen', en: 'dice' },
  },
  roll: { nl: 'Gooi', en: 'Roll' },
  rollIsConfirm: { nl: '"Gooi" bevestigt tegelijk de aanval.', en: '"Roll" also confirms the attack.' },
  endAttackPhase: { nl: 'Aanvalsfase beëindigen', en: 'End attack phase' },

  attackAgain: { nl: 'Nog een keer aanvallen', en: 'Attack again' },
  otherFight: { nl: 'Ander gevecht', en: 'Other fight' },
  toFortify: { nl: 'Naar Verplaatsen', en: 'To Fortify' },
  resultLine: {
    lost: { nl: 'Jij −{{attackerLosses}} · verdediger −{{defenderLosses}}', en: 'You −{{attackerLosses}} · defender −{{defenderLosses}}' },
  },

  conquest: {
    captured: { nl: 'Veroverd!', en: 'Captured!' },
    moveHowMany: { nl: 'Hoeveel legers verplaats je mee?', en: 'How many armies do you move in?' },
    minNote: {
      nl: 'Minimaal {{min}} (aantal aanvalsdobbelstenen)',
      en: 'At least {{min}} (attack dice used)',
    },
    confirm: { nl: 'Bevestig', en: 'Confirm' },
  },

  defend: {
    underAttack: { nl: 'Je wordt aangevallen', en: 'You are under attack' },
    line: { nl: '{{attacker}} valt {{territory}} aan vanuit {{from}}', en: '{{attacker}} attacks {{territory}} from {{from}}' },
    choose: { nl: 'Verdedig dit gebied.', en: 'Defend this territory.' },
    noTimer: { nl: 'Geen timer — neem je tijd', en: 'No timer — take your time' },
    with1: { nl: 'dobbelsteen', en: 'die' },
    with2: { nl: 'dobbelstenen', en: 'dice' },
    tip: {
      nl: '2 dobbelstenen = meer verdediging, maar je zet 2 legers op het spel.',
      en: '2 dice = stronger defence, but 2 armies at risk.',
    },
    result: {
      held: { nl: 'Je hield stand — aanvaller −{{attackerLosses}}', en: 'You held — attacker −{{attackerLosses}}' },
      lost: { nl: 'Gebied verloren — jij −{{defenderLosses}}', en: 'Territory lost — you −{{defenderLosses}}' },
    },
    backToWait: { nl: 'Terug naar het spel', en: 'Back to the game' },
  },

  bystander: {
    subtitle: { nl: 'Aanvallen', en: 'Attack' },
  },

  elim: {
    title: { nl: 'Je bent uitgeschakeld', en: 'You have been eliminated' },
    subtitle: {
      nl: 'Al je legers zijn verslagen. Je blijft toeschouwer tot het spel eindigt.',
      en: 'All your armies are defeated. You remain a spectator until the game ends.',
    },
    gameContinues: { nl: 'Het spel gaat verder…', en: 'The game continues…' },
  },
} satisfies LocaleTree
