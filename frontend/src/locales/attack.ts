import type { LocaleTree } from '../i18n/types'

/**
 * Aanvallen (`TurnPhaseDto.Attack`, FO §5.3), telefoonkant. Bron:
 * het oorspronkelijke telefoon-design se `isAttack`/`isConquest`-fasen,
 * L964-997 (`isDefend`) en L1005-1013 (`isElim`). De "Kaarteninleg"/kaart-trek-tekst ontbreekt
 * bewust — buiten scope van deze taak, zie het Attack-bouwplan. Het reroll-blok (Generaal-rol,
 * L617-635) is toegevoegd in plan-rollen taak 5 (`reroll`-sectie hieronder).
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
    // Benoemt waar je naartoe gaat, niet "Terug" — zelfde keuze als `join:role.back`
    // ("Naam & kleur aanpassen"): op een stapsgewijze flow zegt de bestemming meer dan de richting.
    back: { nl: 'Ander brongebied kiezen', en: 'Pick a different source' },
  },
  pickDice: {
    title: { nl: 'Hoeveel dobbelstenen?', en: 'How many dice?' },
    back: { nl: 'Ander doelwit kiezen', en: 'Pick a different target' },
    hint: {
      nl: 'Max {{max}} — je hebt {{armies}} legers in {{territory}} (1 blijft altijd staan).',
      en: 'Max {{max}} — you have {{armies}} armies in {{territory}} (1 always stays).',
    },
    diceWord1: { nl: 'dobbelsteen', en: 'die' },
    diceWord2: { nl: 'dobbelstenen', en: 'dice' },
  },
  roll: { nl: 'Gooi', en: 'Roll' },
  endAttackPhase: { nl: 'Aanvalsfase beëindigen', en: 'End attack phase' },

  attackAgain: { nl: 'Nog een keer aanvallen', en: 'Attack again' },
  otherFight: { nl: 'Ander gevecht', en: 'Other fight' },
  toFortify: { nl: 'Naar Verplaatsen', en: 'To Fortify' },
  // Verhalend i.p.v. de scorebord-notatie "Jij −0 · verdediger −1" (2026-08-13, op verzoek):
  // twee mintekens naast elkaar lieten niet zien wie er won. `_one`/`_other` is i18next's eigen
  // meervoudsafhandeling op `count` — nodig omdat "1 legers" anders in beeld komt (zie de TV-
  // tegenhanger `attackTv.resultLine`, waar dat nog gebeurt).
  resultLine: {
    won_one: { nl: 'Jij verslaat {{count}} leger', en: 'You defeat {{count}} army' },
    won_other: { nl: 'Jij verslaat {{count}} legers', en: 'You defeat {{count}} armies' },
    lost_one: { nl: 'Jij verliest {{count}} leger', en: 'You lose {{count}} army' },
    lost_other: { nl: 'Jij verliest {{count}} legers', en: 'You lose {{count}} armies' },
    // Vast op 1-om-1: een gemengde uitkomst kán niet anders. Elk vergeleken dobbelsteenpaar kost
    // precies één kant één leger (FO §5.3.5), dus verliezen beide kanten iets, dan waren het er
    // twee paren en verloor elke kant er één.
    both: { nl: 'Jullie verliezen allebei 1 leger', en: 'You both lose 1 army' },
  },

  // Rol-herwerp (FO §8.1, plan-rollen B1/C5): de aanvaller mag, met een actieve `Reroll`-rol,
  // vóór de verdedigingsworp één eigen dobbelsteen herwerpen — per doelgebied per beurt.
  reroll: {
    instruction: {
      nl: 'Herwerp een dobbelsteen voordat de verdediger gooit',
      en: 'Reroll a die before the defender throws',
    },
    confirm: { nl: 'Herwerpen', en: 'Reroll' },
    keep: { nl: 'Doorgaan', en: 'Continue' },
  },

  conquest: {
    // Gebied vóór de uitroep (2026-08-13, op verzoek): het gebied is waar dit scherm over gaat,
    // "Veroverd!" is de kwalificatie erbij. Eén sleutel met interpolatie i.p.v. een losse
    // uitroep + een los gebied in de markup, zodat de woordvolgorde per taal kan verschillen.
    captured: { nl: '{{territory}} veroverd!', en: '{{territory}} captured!' },
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
    // Legerstand-regel (TV-testronde bevinding 1, 2026-09-23): `defenderArmyCount` kwam al
    // binnen maar werd alleen voor de 1-dobbelsteenregel gebruikt, nergens getoond.
    myArmies: { nl: 'Jouw legers op {{territory}}: {{count}}', en: 'Your armies on {{territory}}: {{count}}' },
    attackerArmies: { nl: 'Aanvaller vanuit {{territory}}: {{count}}', en: 'Attacker from {{territory}}: {{count}}' },
    choose: { nl: 'Verdedig dit gebied.', en: 'Defend this territory.' },
    // B6: zichtbaar i.p.v. `choose` zolang de aanvaller nog "Herwerp"/"Doorgaan" moet kiezen —
    // de keuzeknoppen blijven gemount maar uitgeschakeld (geen apart scherm).
    awaitingReroll: { nl: 'Aanvaller overweegt een herwerp…', en: 'Attacker is considering a reroll…' },
    noTimer: { nl: 'Geen timer — neem je tijd', en: 'No timer — take your time' },
    with1: { nl: 'dobbelsteen', en: 'die' },
    with2: { nl: 'dobbelstenen', en: 'dice' },
    tip: {
      nl: '2 dobbelstenen = meer verdediging, maar je zet 2 legers op het spel.',
      en: '2 dice = stronger defence, but 2 armies at risk.',
    },
    // Dobbelregel = Huisregel (FO §5.3 stap 4, §10): vervangt `tip` wanneer de aanvaller met 1
    // gooit — zonder uitleg zou het uitgeschakelde "2"-kaartje onverklaard blijven.
    houseRuleOneDie: {
      nl: 'De aanvaller gooit met 1 dobbelsteen — volgens de huisregel verdedig je dan ook met 1.',
      en: 'The attacker rolls 1 die — under the house rule you defend with 1 as well.',
    },
    // DefenseBoost-rol (FO §8.1): zelfde instructieregel-idioom als `reroll.instruction`.
    boost: {
      nl: '{{role}}: verdedig deze ronde één keer toch met 2 dobbelstenen.',
      en: '{{role}}: once this round, defend with 2 dice anyway.',
    },
    // Verhalend, dezelfde behandeling als attack.resultLine hierboven (2026-08-13, op verzoek) —
    // i.p.v. de aanvaller centraal te zetten ("aanvaller −N") vertelt dit vanuit de verdediger
    // zelf, en i.p.v. de vaste "Je hield stand"-vlag ongeacht verliezen wordt de uitkomst zelf
    // benoemd. `_one`/`_other` is i18next's meervoudsafhandeling op `count`, zelfde reden als bij
    // `resultLine`. Gemengde uitslag → altijd 1-om-1 (FO §5.3.5, zie `resultLine.both`), dus
    // `both` is hier evengoed geldig en richtingsonafhankelijk — geen aparte verdedigersversie
    // nodig.
    result: {
      won_one: { nl: 'Je verslaat {{count}} leger', en: 'You defeat {{count}} army' },
      won_other: { nl: 'Je verslaat {{count}} legers', en: 'You defeat {{count}} armies' },
      both: { nl: 'Jullie verliezen allebei 1 leger', en: 'You both lose 1 army' },
      lost_one: { nl: 'Je verliest {{count}} leger', en: 'You lose {{count}} army' },
      lost_other: { nl: 'Je verliest {{count}} legers', en: 'You lose {{count}} armies' },
      conquered: { nl: 'Je verliest het gebied', en: 'You lose the territory' },
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
