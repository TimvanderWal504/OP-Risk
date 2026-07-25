import type { LocaleTree } from '../i18n/types'

/** Wachtkamer op TV en telefoon (FO §2.1/§10): QR/URL, spelerslijst, instellingen-samenvatting. */
export const lobby = {
  header: {
    badge: { nl: 'Wachtkamer', en: 'Waiting room' },
  },
  tvUrlPanel: {
    label: { nl: 'Open op de TV', en: 'Open on the TV' },
  },
  qr: {
    ariaLabel: { nl: 'QR-code om te joinen op {{url}}', en: 'QR code to join at {{url}}' },
    scanToJoin: { nl: 'Scan om te joinen', en: 'Scan to join' },
  },
  players: {
    title: { nl: 'Spelers', en: 'Players' },
    noColorYet: { nl: 'Nog geen kleur', en: 'No color yet' },
    waitingForPlayer: { nl: 'Wachten op speler', en: 'Waiting for player' },
  },
  settings: {
    title: { nl: 'Instellingen', en: 'Settings' },
    map: { nl: 'Kaart', en: 'Map' },
    mapValue: { nl: 'Standaard · 43 gebieden', en: 'Standard · 43 territories' },
    winCondition: { nl: 'Winconditie', en: 'Win condition' },
    setupMode: { nl: 'Startopstelling', en: 'Starting setup' },
    startingArmies: { nl: 'Startlegers', en: 'Starting armies' },
    turnTimer: { nl: 'Beurttimer', en: 'Turn timer' },
    fortifyTimer: { nl: 'Verplaatsen-timer', en: 'Fortify timer' },
    roles: { nl: 'Rollen', en: 'Roles' },
    eventsRound: { nl: 'Gebeurtenisronde', en: 'Events round' },
    on: { nl: 'Aan', en: 'On' },
    off: { nl: 'Uit', en: 'Off' },
  },
  winCondition: {
    worldDomination: { nl: 'Werelddominantie', en: 'World domination' },
    secretMissions: { nl: 'Geheime missies', en: 'Secret missions' },
  },
  setupMode: {
    random: { nl: 'Random', en: 'Random' },
    claiming: { nl: 'Claimen', en: 'Claiming' },
  },
  roleAssignment: {
    random: { nl: 'Random', en: 'Random' },
    choose: { nl: 'Kiezen', en: 'Choose' },
  },
  placeholder: {
    tv: {
      nl: 'Spel is gestart — het bord volgt in een latere bouwplak.',
      en: 'Game has started — the board follows in a later build slice.',
    },
    phone: {
      nl: 'Spel is gestart — het spelbord volgt in een latere bouwplak.',
      en: 'Game has started — the board follows in a later build slice.',
    },
  },
  tv: {
    unknownGame: { nl: 'Onbekend spel.', en: 'Unknown game.' },
    connecting: { nl: 'Verbinden…', en: 'Connecting…' },
  },
} satisfies LocaleTree
