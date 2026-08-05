import type { LocaleTree } from '../i18n/types'

/** Instellingen-scherm van de host (`components/CreateGameForm.tsx`). */
export const createGame = {
  header: {
    title: { nl: 'Instellingen', en: 'Settings' },
  },
  section: {
    rules: { nl: 'Spelregels', en: 'Game rules' },
    extras: { nl: 'Extra spelelementen', en: 'Extra game elements' },
  },
  /** Vaste kaart: `HomePage` levert altijd `standaard-43`, er is geen kaartkeuze. */
  map: {
    summary: {
      nl: 'Standaard · 43 gebieden · 6 continenten',
      en: 'Standard · 43 territories · 6 continents',
    },
  },
  winCondition: {
    title: { nl: 'Winconditie', en: 'Win condition' },
    worldDomination: {
      title: { nl: 'Werelddominantie', en: 'World domination' },
      description: { nl: 'Verover alle gebieden.', en: 'Conquer every territory.' },
    },
    secretMissions: {
      title: { nl: 'Geheime missies', en: 'Secret missions' },
      description: {
        nl: 'Iedere speler een geheime opdracht.',
        en: 'Every player gets a secret mission.',
      },
    },
  },
  setupMode: {
    title: { nl: 'Startopstelling', en: 'Starting setup' },
    description: { nl: 'Hoe worden gebieden verdeeld?', en: 'How are territories distributed?' },
    random: { nl: 'Random', en: 'Random' },
    claiming: { nl: 'Claimen', en: 'Claiming' },
  },
  startingArmies: {
    title: { nl: 'Startlegers', en: 'Starting armies' },
    description: {
      nl: 'Legers per speler; het exacte aantal volgt uit het spelersaantal zodra de lobby sluit.',
      en: 'Armies per player; the exact count follows from the player count once the lobby closes.',
    },
    preset: {
      classic: {
        title: { nl: 'Klassiek', en: 'Classic' },
        description: { nl: '40 t/m 18 legers (2–7 spelers).', en: '40 to 18 armies (2–7 players).' },
      },
      modern: {
        title: { nl: 'Modern', en: 'Modern' },
        description: { nl: '45 t/m 23 legers (2–7 spelers).', en: '45 to 23 armies (2–7 players).' },
      },
      'classic-49': {
        title: { nl: 'Klassiek-49', en: 'Classic-49' },
        description: { nl: '50 t/m 27 legers (2–7 spelers).', en: '50 to 27 armies (2–7 players).' },
      },
    },
  },
  turnTimer: {
    label: { nl: 'Beurttimer', en: 'Turn timer' },
    sub: { nl: 'Per beurt (Versterken + Aanvallen).', en: 'Per turn (Reinforce + Attack).' },
  },
  roles: {
    label: { nl: 'Rollen', en: 'Roles' },
    sub: { nl: 'Openbare rol + herkomstland-bonus.', en: 'Public role + home-territory bonus.' },
  },
  events: {
    label: { nl: 'Gebeurtenisronde', en: 'Event round' },
    sub: { nl: 'Gebeurteniskaart na elke ronde.', en: 'Event card after every round.' },
  },
  submit: {
    busy: { nl: 'Bezig…', en: 'Working…' },
    idle: { nl: 'Spel aanmaken', en: 'Create game' },
  },
  errors: {
    createFailed: { nl: 'Spel aanmaken is mislukt.', en: 'Failed to create the game.' },
    connection: {
      nl: 'Kon geen verbinding maken met de server.',
      en: 'Could not connect to the server.',
    },
  },
} satisfies LocaleTree
