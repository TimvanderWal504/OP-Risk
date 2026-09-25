import type { LocaleTree } from '../i18n/types'

/**
 * "TV opzetten": het koppelscherm op de TV (`routes/tv/TvPairPage.tsx`) en de koppelstap op de
 * host-telefoon (`routes/phone/HomePage.tsx`, route `/pair/:pairingCode`).
 */
export const tvPairing = {
  tv: {
    badge: { nl: 'TV koppelen', en: 'Pair TV' },
    scanTitle: { nl: 'Scan met de telefoon van de host', en: "Scan with the host's phone" },
    ariaLabel: { nl: 'QR-code om deze TV te koppelen via {{url}}', en: 'QR code to pair this TV via {{url}}' },
    waiting: { nl: 'Wachten tot de host een spel koppelt…', en: 'Waiting for the host to pair a game…' },
    connecting: { nl: 'Verbinden…', en: 'Connecting…' },
    failed: { nl: 'Kon geen koppelcode ophalen.', en: 'Could not get a pairing code.' },
  },
  phone: {
    title: { nl: 'TV gevonden', en: 'TV found' },
    description: {
      nl: 'Start een nieuw spel of stuur een bestaande spelcode naar de TV.',
      en: 'Start a new game or send an existing game code to the TV.',
    },
    sendCard: {
      title: { nl: 'Spelcode naar TV sturen', en: 'Send game code to TV' },
      description: {
        nl: 'Voor een lobby die al bestaat.',
        en: 'For a lobby that already exists.',
      },
    },
    send: { nl: 'Naar TV sturen', en: 'Send to TV' },
    continueToLobby: { nl: 'Naar de lobby', en: 'Go to the lobby' },
    sent: {
      title: { nl: 'Verstuurd naar de TV', en: 'Sent to the TV' },
      description: {
        nl: 'De TV toont nu spel {{gameId}}.',
        en: 'The TV now shows game {{gameId}}.',
      },
    },
  },
} satisfies LocaleTree
