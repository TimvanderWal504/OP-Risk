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
| Spelerskleuren (overal waar een spelerskleur getoond wordt) | `data/colors.json` geeft rood `#ca3c25`, blauw `#0057ff`, paars `#6a00f4`, en een andere symbooltoewijzing per kleur (rood=circle, blauw=square, groen=triangle, geel=diamond, paars=star) | `ds/colors_and_type.css` L130-136 geeft `--player-red:#800020`, `--player-blue:#1d5da8`, `--player-purple:#7900b0` en ▲Rood ●Blauw ■Groen ★Geel ✚Paars | zichtbaar op elk speler-element (avatars, badges, en straks de kaart): drie van de zeven kleuren en de symbooltoewijzing wijken af van het design. Groen en oranje zijn wél gelijkgetrokken (commit 820bda0), de rest bewust niet — `data/colors.json` is bevroren speeldata en blijft leidend voor de runtime |
| useHeldPhase.ts | Order-roll-scherm blijft 8 seconden staan nadat de server de fase al verlaten heeft | De export schrijft geen hold voor: het volgordescherm schakelt daar op state (`sc-if isOrder`), en de enige `setTimeout`s in beide exports zijn layout-fits van 120/400 ms | nodig, anders ziet niemand de bepaalde volgorde — de server springt meteen door. Presentatietiming, geen spelregel: de uitkomst verandert er niet door en er wordt niet op de server vooruitgelopen |
| LobbyPlayerList.tsx | Eén vaste "wacht-slot"-kaart | één "wacht-slot"-kaart per open plek | Spelers zien nu minder snel hoeveel plekken er nog open zijn. Echter is dit nog wel inzichtelijk binnen de lobby door de hoeveelheid plekken aan te geven — minimaal|
| CreateGameForm.tsx (startlegers-rij) | Een keuzegroep van `SelectableOption`-kaarten (Klassiek/Modern/Klassiek-49) | Telefoon.dc.html L189-202 (`armyInc`/`armyDec`) toont hier een +/− stepper voor een los getal | zichtbaar in het "Nieuw spel"-scherm — bewust en expliciet op verzoek van de gebruiker: de klassieke tabel per spelersaantal bestond niet, en een los getal zonder relatie tot het spelersaantal liet ongeldige combinaties toe (FO §5.1/§10). Geaccepteerde afwijking, geen bevinding meer |
| TurnStatusHeader.tsx | Timer schakelt naar de rode "laag"-staat bij < 60s resterend (`TIMER_LOW_THRESHOLD_MS`) | Host-scherm.dc.html doorloopt `normal/low/paused` puur als demo-cyclus (L666) zonder numerieke drempel — geen waarde om over te nemen | nagevraagd bij de gebruiker tijdens het bouwen (2026-08-01) en op 60s vastgesteld; presentatiedrempel, geen spelregel — de server bepaalt zelf wanneer de fase geforceerd eindigt, deze drempel verandert daar niets aan |
| TvMainBoardScreen.tsx | Geen rechterspelerspaneel (402px-kolom) en geen feed-strip (onderrand) — de kaart neemt nu de volledige beschikbare breedte/hoogte in i.p.v. de `1fr 402px`/`146px`-indeling uit de export | Host-scherm.dc.html "Main board" (L258) toont beide permanent naast/onder het bord | geaccepteerde scope-afbakening: geen deliverable in het goedgekeurde Reinforce-plan, en de feed-strip heeft sowieso nog geen server-databron (geen log/event-DTO). Impact: het bord oogt voller/kaler dan de export tot een vervolgtaak het paneel bouwt — geen functieverlies, alle paneeldata (gebieds-/legertotalen) is al af te leiden uit `GameStateDto` zodra dat opgepakt wordt |
| PlaceReinforcementStep.tsx | Gebiedenlijst is per-continent gegroepeerd in inklapbare secties (2+ groepen: dicht, 1 groep: open zonder chevron); "Kaarteninleg"-blok ontbreekt | Telefoon.dc.html L501-540 (`isReinf`) toont een platte lijst zonder groepering, plus een gouden "Kaarteninleg"-blok (L519-526) | continent-groepering: bewuste afwijking, nagevraagd tijdens het bouwen — voorkomt een onbeheersbaar lange lijst bij 10+ eigen gebieden, iets wat bij Claimen (waar de export wél groepeert) evenzeer speelt. Kaarteninleg: blokkeert op het ontbrekende hand-DTO (TO §6.1), zie "Buiten scope" in het Reinforce-plan — geen bevinding, al voorzien |
| PlaceReinforcementStep.tsx | De onderste knop kent 3 staten (verdelen/bevestigen/klaar) i.p.v. de 2 uit het design (verdelen/klaar) | Telefoon.dc.html L538 (`reinfDoneBg`/`reinfDoneLabel`) kent alleen "nog legers te verdelen" en "klaar" — de demo plaatst lokaal zonder server-round-trip | noodzakelijk gevolg van de echte server-round-trip (stage-then-confirm): lokaal volledig verdeeld ≠ door de server bevestigd. Zonder de tussenstaat zou "Klaar → Aanvallen" getoond worden vóórdat de server het weet. Zie doc-comment `locales/reinforce.ts` (`confirmLabel`) |
| PlaceReinforcementStep.tsx | "Opbouw"-paneel toont 4 rijen op basis van `ReinforcementBreakdownDto` (Gebieden/Continentbonus/Roleffect/Gebeurteniseffect) i.p.v. de export se 4 rijen (Gebieden/Continentbonus/Rol-met-naam/Kaarteninleg) | Telefoon.dc.html L1706-1711 toont de rolnaam+herkomstland in de roleffect-rij en een aparte kaarteninleg-rij | de server levert alleen het geaggregeerde `RoleBonus`-getal, niet welke rol/effect dat veroorzaakte; kaarteninleg is hier al gemotiveerd uitgesloten (zie vorige rij). Nieuw op verzoek van de gebruiker toegevoegd DTO-veld (`ReinforcementBreakdownDto`, backend + mapper), geen vooruitbouwen zonder scherm — dit scherm bestaat nu |


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