import type { LocaleTree } from '../i18n/types'

/**
 * TV koppelen: het koppelscherm op de TV (`routes/tv/TvPairPage.tsx`) en de host-telefoon die de
 * QR scant (`routes/phone/HomePage.tsx`, route `/pair/:pairingCode`).
 */
export const tvPairing = {
  tv: {
    badge: { nl: 'TV koppelen', en: 'Pair TV' },
    scanTitle: { nl: 'Scan met de telefoon van de host', en: "Scan with the host's phone" },
    ariaLabel: { nl: 'QR-code om deze TV te koppelen via {{url}}', en: 'QR code to pair this TV via {{url}}' },
    waiting: {
      nl: 'Wachten tot de host scant en een spel aanmaakt…',
      en: 'Waiting for the host to scan and create a game…',
    },
    connecting: { nl: 'Verbinden…', en: 'Connecting…' },
    failed: { nl: 'Kon geen koppelcode ophalen — opnieuw proberen…', en: 'Could not get a pairing code — retrying…' },
  },
  phone: {
    pairingCode: {
      title: { nl: 'Code van de TV', en: 'TV code' },
      placeholder: { nl: 'bv. K7M2PQ', en: 'e.g. K7M2PQ' },
      submit: { nl: 'Verder naar instellingen', en: 'Continue to settings' },
    },
    continueToLobby: { nl: 'Naar de lobby', en: 'Go to the lobby' },
    retry: {
      title: { nl: 'De TV heeft het spel nog niet', en: "The TV doesn't have the game yet" },
      description: {
        nl: 'Spel {{gameId}} is aangemaakt, maar kon niet naar de TV worden gestuurd.',
        en: 'Game {{gameId}} was created, but could not be sent to the TV.',
      },
      resend: { nl: 'Opnieuw naar de TV sturen', en: 'Send to the TV again' },
    },
  },
} satisfies LocaleTree
