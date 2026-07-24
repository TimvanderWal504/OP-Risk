# Technische kaders — frontend (component-driven development)

- **Eén component per bestand**, gecolokeerd met zijn eigen test
  (`TerritoryLabel.tsx` + `TerritoryLabel.test.tsx`).
- **Presentational vs. container gescheiden**: componenten in `components/`
  krijgen data via props en renderen — ze roepen zelf nooit SignalR aan. Alle
  state/data-logica zit in `hooks/` (`useSignalR`, `useGameState`) en wordt
  als props doorgegeven.
- **Kleine, samenstelbare componenten in `components\ui`** i.p.v. één groot 
  TV-of telefoonscherm-component: bouw op uit `MapOverlay`, `TurnIndicator`,
  `DiceRoller`, `TerritoryLabel`, etc. — elk apart testbaar en herbruikbaar.
- **Typed props via interfaces in `types/`**, nooit `any`. Eén interface per
  component-props, gedeelde domeintypes (GameState, Territory, Player) apart
  van component-specifieke props.
- **`design-reference/` is visuele bron, geen startpunt om te kopiëren**: haal
  de stijl/opbouw eruit, bouw de component opnieuw op met echte state en de
  bovenstaande structuur.

  ## Server-authoritative, ook in de client

- De client bevat GEEN spellogica — geen "mag ik aanvallen"-berekening, geen
  dobbeluitkomst, geen bonusberekening. De client rendert server-state en
  toont de opties die de server aanlevert. Als je merkt dat je een spelregel
  in TypeScript aan het herbouwen bent: stoppen, dat is een ontwerpfout.
- Geen optimistic updates op speltoestand: een actie is pas zichtbaar als de
  server 'm bevestigd heeft (TO §6.2). Loading-states zijn prima; voorspelde
  state niet.

## Types

- Gedeelde DTO-types (GameState, Territory, Player) staan in `types/` en
  spiegelen exact de C#-DTO's — zelfde veldnamen, zelfde structuur. Eén bron
  van waarheid per type; niet "handig" hernoemen aan de TS-kant.
- Kleine, samenstelbare componenten staan in `components\ui` en bevatten 
  onderdelen die elk scherm/component kan hergebruiken om zoveel mogelijk
  componenten te kunnen hergebruiken en de codebase clean te houden.

## Styling

- Alleen Tailwind-utilities en de tokens uit design-reference/shared —
  geen losse CSS-bestanden of inline styles naast Tailwind, geen zelfverzonnen
  kleuren buiten colors.json en het design system.