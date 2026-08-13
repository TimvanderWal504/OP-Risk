import type { LocaleTree } from '../i18n/types'

/**
 * Startopstelling op de telefoon (FO §5.1): gebieden claimen (bij SetupMode
 * Claiming) of startlegers plaatsen (InitialPlacement), plus het gedeelde
 * "niet jouw beurt"-scherm.
 */
export const setup = {
  claim: {
    title: { nl: 'Claim een leeg gebied', en: 'Claim an empty territory' },
    sub: {
      nl: 'Kies om de beurt één vrij gebied. Zo verdelen jullie de kaart voordat de legers worden bijgeplaatst.',
      en: 'Take turns picking one free territory. This is how you split the map before armies are added.',
    },
    left: { nl: 'nog vrij', en: 'still free' },
    confirm: { nl: 'Claim', en: 'Claim' },
    pickFirst: { nl: 'Claim ↑', en: 'Claim ↑' },
    claimedBy: { nl: 'Al geclaimd', en: 'Claimed so far' },
    you: { nl: 'jij', en: 'you' },
    colTerr: { nl: 'geb', en: 'reg' },
    yourTurnSoon: {
      nl: 'Zo ben jij weer aan de beurt om te claimen.',
      en: "You'll be up to claim again shortly.",
    },
  },
  place: {
    title: { nl: 'Plaats je legers', en: 'Place your armies' },
    armiesLeft: { nl: 'te plaatsen', en: 'to place' },
    hint: {
      nl: 'Tik + om 1 leger op een van je gebieden te zetten. Om beurten, 1 per keer.',
      en: 'Tap + to place 1 army on one of your territories. Taking turns, one at a time.',
    },
  },
  idle: {
    nowPlaying: { nl: 'Aan de beurt', en: 'Now playing' },
    /**
     * Faseduiding in de "niet jouw beurt"-banner. Bewust niet `place.title`
     * ("Plaats je legers"/"Place your armies") hergebruikt: dat is een opdracht aan de speler
     * die aan zet is, en op dit scherm las het als een opdracht aan de lezer, die juist niets
     * kan doen. Nu een fasenaam, net als `attack:bystander.subtitle` ("Aanvallen") en
     * `reinforce:kicker` ("Versterken").
     */
    placingArmies: { nl: 'Legers plaatsen', en: 'Placing armies' },
    turnComesToYou: {
      nl: 'Je krijgt vanzelf bericht als jij aan zet bent.',
      en: "You'll be notified when it's your move.",
    },
  },
} satisfies LocaleTree
