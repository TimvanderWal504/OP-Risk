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

## Design-conformiteit (bindend)

Bron: `design-reference/tv/Operatie Atlas Host-scherm.dc.html` (TV/host) en
`design-reference/phone/Operatie Atlas Telefoon.dc.html` (telefoon).

### Verplichte eerste stap
Voordat je één regel component-code schrijft: open het relevante `.dc.html`-bestand
en lees de secties die bij jouw component horen — markup, de bijbehorende CSS-regels
én de keyframes/transities. Niet fragmentarisch grepen en de rest aannemen. Meld in
je afronding welk bestand je hebt gelezen en welke selectors/regels je hebt gebruikt.

Kun je de relevante regels niet vinden, dan is dat een bevinding: melden en stoppen,
niet zelf een aannemelijke waarde kiezen.

### Wat exact overgenomen wordt
Uit de export komen letterlijk, zonder herinterpretatie:
- afmetingen, spacing, padding, gaps, radii, borders
- typografie: family, size, weight, line-height, letter-spacing, transform
- kleuren, opacity, laagvolgorde
- posities en verhoudingen binnen een scherm
- alle states: default, hover, focus, active, disabled, selected, empty, loading
- alle beweging: duur, delay, easing, keyframes, stagger, richting

Waarden worden overgenomen als waarde, niet "ongeveer": 14px blijft 14px en wordt
geen `text-sm` als dat 13.6px oplevert. Wijkt de dichtstbijzijnde Tailwind-utility
af van de export, dan gebruik je een arbitrary value (`p-[13px]`) of een token.

### Wat wél mag afwijken
Alleen de plumbing: databron (server-state i.p.v. mock), event-handlers,
componentgrenzen, bestandsindeling, prop-namen, en accessibility-attributen die in
de export ontbreken. De DOM-structuur mag anders zijn zolang het resultaat
visueel identiek is.

### Tokens
De export wordt éénmalig geëxtraheerd naar `frontend/src/design-reference/shared/`:
- `design-tokens.ts` — kleuren, spacing, typografie, radii
- `motion.ts` — elke duur, delay, easing en keyframe uit het design

Componenten refereren aan die tokens. Nooit een hardcoded pixel- of ms-waarde in een
component, en nooit een waarde die niet uit de export komt. Mis je een token, dan is
de extractie incompleet: melden, niet aanvullen.

### Afwijkingenlijst
Elke afronding van een component met een design-tegenhanger bevat een expliciete
lijst van afwijkingen t.o.v. de export, met reden. Lege lijst is het doel en een
prima antwoord. "Geen afwijkingen" zonder dat je de export erbij hebt gehad is
geen geldig antwoord.

#### Afwijkingen gevonden
Mochten er afwijkingen bij een component van het design gevonden zijn, moet je deze
altijd melden. Het kan voorkomen dat de gebruiker zelf styling heeft toegepast binnen
het project om het meer te laten lijken op het design. of om andere redenen. 
Meldt wat er anders is, wat je verwacht had, waar dit van toepassing is en wat dit 
voor impact heeft op de applicatie, zodat de gebruiker een keuze kan maken of dit een
uitzondering betreft en doorgezet mag worden. Uitzonderingen worden hieronder bewaard
en worden niet meer gemeld als afwijking.

#### Uitzonderingen

|Waar is het op van toepassing| Wat is er anders|Wat was de verwachting|Impact op applicatie|
| RemovablePlayerRow.tsx | Breedte van de knop is w-[19.5%] | Breedte van de knop is w-[22.5%] | minimaal |
| ClaimTerritoryStep.tsx | Geen `claimSimRound`-knop ("Volgende ronde (demo)") | Telefoon.dc.html L445 toont die knop in de "niet jouw beurt"-substaat van Claim | geen — de knop was een designdemo-simulatie zonder server-tegenhanger; server drijft de voortgang echt |

## Animatie

- Alle beweging komt uit het design en staat in `motion.ts`. Er wordt geen timing,
  easing of keyframe verzonnen, afgerond of "gladgetrokken". `ease-in-out` is geen
  vervanging voor de cubic-bezier uit de export.
- **Animeer alleen `transform` en `opacity`.** Het host-scherm draait op een TV met
  een zwakke GPU; alles wat layout of paint triggert (width, height, top, left,
  margin, box-shadow, filter) stottert daar. Vraagt het design om zo'n effect, dan
  is dat een bevinding — melden, niet stilzwijgend anders oplossen.
- **TV en telefoon hebben verschillende motion-profielen.** Het host-scherm gebruikt
  de tragere schermovergangen uit de TV-export; de telefoon wisselt schermen instant.
  Dat verschil zit in één device-flag, niet in aparte componenten.
- Beweging wordt gedreven door server-state, nooit door een timer die de server
  vooruitloopt. Een animatie start pas als de server de transitie bevestigd heeft
  (TO §6.2) — een animatie is óók een optimistic update als je 'm te vroeg afvuurt.
- `prefers-reduced-motion: reduce` schakelt alle niet-essentiële beweging uit.
- Geen animatiebibliotheek zonder overleg. Tailwind-transities of de Web Animations
  API voldoen; framer-motion is een dependency-beslissing, geen implementatiedetail.

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

- Alleen Tailwind-utilities en de tokens uit `design-reference/shared` — geen losse
  CSS-bestanden, geen zelfverzonnen kleuren buiten `colors.json` en het design system.
- Levert de export een waarde die geen exacte Tailwind-utility heeft, dan gaat de
  exacte waarde vóór de utility: arbitrary value (`gap-[18px]`) of een token uit
  `design-tokens.ts`. Afronden naar de dichtstbijzijnde utility is een afwijking en
  hoort in de afwijkingenlijst.
- Keyframes uit de export komen in de Tailwind-config (`theme.extend.keyframes` /
  `animation`), afgeleid van `motion.ts` — niet als los CSS-bestand.