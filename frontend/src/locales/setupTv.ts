import type { LocaleTree } from '../i18n/types'

/**
 * TV tijdens de startopstelling (FO §5.1): Claimen (Host-scherm.dc.html L184-254, `isClaim`,
 * letterlijke tekst L840/L856) en Bijplaatsen (geen aparte TV-staat in de export — bevestigde
 * bevinding, zie het bouwplan; hergebruikt daarom de telefoon-copy uit `setup.ts` `place.*`
 * voor consistentie tussen TV en telefoon tijdens dezelfde fase).
 */
export const setupTv = {
  claimKicker: { nl: 'Startopstelling · Claimen', en: 'Setup · Claim' },
  claimCounterLabel: { nl: 'gebieden verdeeld', en: 'territories dealt' },
  claimPanelTitle: { nl: 'Geclaimd', en: 'Claimed' },
  placeKicker: { nl: 'Startopstelling', en: 'Setup' },
  placeTitle: { nl: 'Plaats je legers', en: 'Place your armies' },
  /**
   * `activePlayerId === null` tijdens InitialPlacement (SetupMode.Random, gelijktijdig
   * plaatsen) — geen exportwaarde, expliciet als afwijking gemeld in de afwijkingenlijst.
   */
  placeEveryoneAtOnce: { nl: 'Iedereen plaatst tegelijk', en: 'Everyone places at once' },
} satisfies LocaleTree
