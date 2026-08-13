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

Bron: `DESIGN.md` (repo-root) + de sidecar `.impeccable/design.json`, samen de
Impeccable-gegenereerde visuele spec. Voor de letterlijke, pixel-/ms-exacte
waarden: `frontend/src/styles/design-tokens.ts` en `frontend/src/styles/motion.ts`.

Dit verving eerder (2026-08-04) een ruwe, bevroren Design-MCP-export
(`design-reference/*.dc.html`) die letterlijk overgenomen moest worden. Die
export is verwijderd; de discipline hieronder is bewust losser dan voorheen —
zie "Wat exact overgenomen wordt".

### Verplichte eerste stap
Voordat je één regel component-code schrijft: lees `DESIGN.md` (en, voor
componentdetails, de `components`-sectie in `.impeccable/design.json`) voor de
relevante Kleuren/Typografie/Shapes/Components-secties. Kun je een waarde niet
vinden in `DESIGN.md`, de sidecar, of `design-tokens.ts`/`motion.ts`, dan is dat
een bevinding: melden en stoppen, niet zelf een aannemelijke waarde kiezen.

### Wat exact overgenomen wordt
`DESIGN.md` is beschrijvend, geen pixel-exacte spec (dat is een bewuste
eigenschap van het format, niet een gat) — het beschrijft rollen, karakter en
richtwaarden. De **exacte** waarden (pixels, hex, ms, easing) staan en blijven
letterlijk in `design-tokens.ts`/`motion.ts`; componenten refereren daaraan.
Nooit een hardcoded pixel- of ms-waarde rechtstreeks in een component, en nooit
een waarde die niet uit de tokens komt. Mis je een token, dan is de extractie
incompleet: melden, niet aanvullen.

### Wat wél mag afwijken
Naast de plumbing (databron, event-handlers, componentgrenzen, bestandsindeling,
prop-namen, ontbrekende accessibility-attributen): een bewuste, expliciet door de
gebruiker opgedragen visuele wijziging — mits gevolgd door een `DESIGN.md`-
regeneratie (`/impeccable document`) zodat de spec niet achterloopt op de code.
Stilzwijgende "verbeteringen" blijven een bevinding, geen invulruimte.

### Tokens
Broncode, niet langer een ruwe export, in `frontend/src/styles/`:
- `design-tokens.ts` — kleuren, spacing, typografie, radii
- `motion.ts` — elke duur, delay, easing en keyframe
- `ds/colors_and_type.css`, `ds/twc-theme.css` — de daadwerkelijke runtime-CSS
  (rechtstreeks `@import`ed in `index.css`), niet alleen referentiemateriaal

Componenten refereren aan die tokens. Nooit een hardcoded pixel- of ms-waarde in een
component, en nooit een waarde die niet uit de tokens komt. Mis je een token, dan is
de extractie incompleet: melden, niet aanvullen.

### Afwijkingenlijst
Elke afronding van een component met een design-tegenhanger bevat een expliciete
lijst van afwijkingen t.o.v. `DESIGN.md`/de tokens, met reden. Lege lijst is het
doel en een prima antwoord. "Geen afwijkingen" zonder dat je `DESIGN.md`/de
tokens erbij hebt gehad is geen geldig antwoord.

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
| ClaimTerritoryStep.tsx | Geen `claimSimRound`-knop ("Volgende ronde (demo)") | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie) toonde die knop in de "niet jouw beurt"-substaat van Claim | geen — de knop was een designdemo-simulatie zonder server-tegenhanger; server drijft de voortgang echt |
| Spelerskleuren (overal waar een spelerskleur getoond wordt) | `data/colors.json` geeft rood `#ca3c25`, blauw `#0057ff`, paars `#6a00f4`, en een andere symbooltoewijzing per kleur (rood=circle, blauw=square, groen=triangle, geel=diamond, paars=star) | `ds/colors_and_type.css` L130-136 geeft `--player-red:#800020`, `--player-blue:#1d5da8`, `--player-purple:#7900b0` en ▲Rood ●Blauw ■Groen ★Geel ✚Paars | zichtbaar op elk speler-element (avatars, badges, en straks de kaart): drie van de zeven kleuren en de symbooltoewijzing wijken af van het design. Groen en oranje zijn wél gelijkgetrokken (commit 820bda0), de rest bewust niet — `data/colors.json` is bevroren speeldata en blijft leidend voor de runtime |
| useHeldPhase.ts | Order-roll-scherm blijft 8 seconden staan nadat de server de fase al verlaten heeft | De export schrijft geen hold voor: het volgordescherm schakelt daar op state (`sc-if isOrder`), en de enige `setTimeout`s in beide exports zijn layout-fits van 120/400 ms | nodig, anders ziet niemand de bepaalde volgorde — de server springt meteen door. Presentatietiming, geen spelregel: de uitkomst verandert er niet door en er wordt niet op de server vooruitgelopen |
| LobbyPlayerList.tsx | Eén vaste "wacht-slot"-kaart | één "wacht-slot"-kaart per open plek | Spelers zien nu minder snel hoeveel plekken er nog open zijn. Echter is dit nog wel inzichtelijk binnen de lobby door de hoeveelheid plekken aan te geven — minimaal|
| CreateGameForm.tsx (startlegers-rij) | Een keuzegroep van `SelectableOption`-kaarten (Klassiek/Modern/Klassiek-49) | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie; `armyInc`/`armyDec`) toonde hier een +/− stepper voor een los getal | zichtbaar in het "Nieuw spel"-scherm — bewust en expliciet op verzoek van de gebruiker: de klassieke tabel per spelersaantal bestond niet, en een los getal zonder relatie tot het spelersaantal liet ongeldige combinaties toe (FO §5.1/§10). Geaccepteerde afwijking, geen bevinding meer |
| TurnStatusHeader.tsx | Timer schakelt naar de rode "laag"-staat bij < 60s resterend (`TIMER_LOW_THRESHOLD_MS`) | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie) doorliep `normal/low/paused` puur als demo-cyclus zonder numerieke drempel — geen waarde om over te nemen | nagevraagd bij de gebruiker tijdens het bouwen (2026-08-01) en op 60s vastgesteld; presentatiedrempel, geen spelregel — de server bepaalt zelf wanneer de fase geforceerd eindigt, deze drempel verandert daar niets aan |
| TvMainBoardScreen.tsx | Geen rechterspelerspaneel (402px-kolom) en geen feed-strip (onderrand) — de kaart neemt nu de volledige beschikbare breedte/hoogte in i.p.v. de `1fr 402px`/`146px`-indeling uit de export | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie; "Main board") toonde beide permanent naast/onder het bord | geaccepteerde scope-afbakening: geen deliverable in het goedgekeurde Reinforce-plan, en de feed-strip heeft sowieso nog geen server-databron (geen log/event-DTO). Impact: het bord oogt voller/kaler dan de export tot een vervolgtaak het paneel bouwt — geen functieverlies, alle paneeldata (gebieds-/legertotalen) is al af te leiden uit `GameStateDto` zodra dat opgepakt wordt |
| PlaceReinforcementStep.tsx | Gebiedenlijst is per-continent gegroepeerd in inklapbare secties (2+ groepen: dicht, 1 groep: open zonder chevron); "Kaarteninleg"-blok ontbreekt | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie; `isReinf`) toonde een platte lijst zonder groepering, plus een "Kaarteninleg"-blok | continent-groepering: bewuste afwijking, nagevraagd tijdens het bouwen — voorkomt een onbeheersbaar lange lijst bij 10+ eigen gebieden, iets wat bij Claimen (waar de export wél groepeert) evenzeer speelt. Kaarteninleg: blokkeert op het ontbrekende hand-DTO (TO §6.1), zie "Buiten scope" in het Reinforce-plan — geen bevinding, al voorzien |
| PlaceReinforcementStep.tsx | De onderste knop kent 3 staten (verdelen/bevestigen/klaar) i.p.v. de 2 uit het design (verdelen/klaar) | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie; `reinfDoneBg`/`reinfDoneLabel`) kende alleen "nog legers te verdelen" en "klaar" — de demo plaatste lokaal zonder server-round-trip | noodzakelijk gevolg van de echte server-round-trip (stage-then-confirm): lokaal volledig verdeeld ≠ door de server bevestigd. Zonder de tussenstaat zou "Klaar → Aanvallen" getoond worden vóórdat de server het weet. Zie doc-comment `locales/reinforce.ts` (`confirmLabel`) |
| TvMainBoardScreen.tsx (`NEUTRAL_STROKE_DESIGN_UNITS`) | Gebieden zonder eigenaar krijgen randdikte 1,25 design-eenheden | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie) kende alleen `sw = isOwn ? tok.ownSw : tok.enSw` — er was geen neutrale staat in de export, dus geen waarde om over te nemen | nagevraagd bij de gebruiker (2026-08-03) en op 1,25 vastgesteld, gelijk aan `ringSwEnemy`. Presentatiekeuze, geen spelregel. De bijbehorende `boardTok.neuStroke` (0,4) wordt gebruikt waar hij hoort — als stroke-opacity naast `ownStroke`/`enStroke`, niet als dikte |
| PlaceReinforcementStep.tsx | "Opbouw"-paneel toont 4 rijen op basis van `ReinforcementBreakdownDto` (Gebieden/Continentbonus/Roleffect/Gebeurteniseffect) i.p.v. de export se 4 rijen (Gebieden/Continentbonus/Rol-met-naam/Kaarteninleg) | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie) toonde de rolnaam+herkomstland in de roleffect-rij en een aparte kaarteninleg-rij | de server levert alleen het geaggregeerde `RoleBonus`-getal, niet welke rol/effect dat veroorzaakte; kaarteninleg is hier al gemotiveerd uitgesloten (zie vorige rij). Nieuw op verzoek van de gebruiker toegevoegd DTO-veld (`ReinforcementBreakdownDto`, backend + mapper), geen vooruitbouwen zonder scherm — dit scherm bestaat nu |
| TvClaimingScreen.tsx, TvMainBoardScreen.tsx en TvInitialPlacementScreen.tsx | Continent-labels (`conts`) en de onderrand-bijschriftbalk ontbreken op alle drie schermen | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie) toonde deze elementen letterlijk in zowel de Claim-sectie als de Hoofdscherm-sectie (plus een radiale zee-/vignet-gradient) | ontdekt tijdens het bouwen van `TvClaimingScreen`, al aanwezig als stille omissie op de andere twee schermen. Nagevraagd bij de gebruiker (2026-08-03): dezelfde scope aanhouden op alle bordschermen — geaccepteerd, geen vervolgtaak gepland vanuit deze taak. |
| TvClaimingScreen.tsx en TvInitialPlacementScreen.tsx | 3-rijen grid (`96px_1fr_146px`, laatste rij leeg) i.p.v. de letterlijke 2-rijen-vorm (`96px_1fr`) uit de Claim-sectie van de export | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie; `isClaim`) gebruikte `grid-template-rows:96px 1fr` — geen 146px-rij | nagevraagd bij de gebruiker (2026-08-03): zonder deze afstemming herberekent `boardScale.ts` de kaartviewport bij elke fase-overgang (Claiming → InitialPlacement → InProgress) en springt de kaart zichtbaar van formaat op een TV. Presentatiekeuze om schermsprongen te voorkomen, geen spelregel |
| TvInitialPlacementScreen.tsx | Geen letterlijke exportsectie — hergebruikt het Hoofdscherm-grid-patroon (`isBoard`) van `TvMainBoardScreen.tsx` | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie) se `states`-lijst kende 10 staten, geen ervan was voor InitialPlacement | bevestigde bevinding, nagevraagd bij de gebruiker (2026-08-03) en zo vastgesteld — geen waarde om letterlijk over te nemen, dus geen invulruimte maar een expliciete keuze |
| TvInitialPlacementScreen.tsx (`placeEveryoneAtOnce`) | Neutrale kop "Iedereen plaatst tegelijk" wanneer `state.setupState.activePlayerId === null` (SetupMode.Random, gelijktijdig plaatsen) | Geen exportwaarde — volgt uit dezelfde bevinding als de vorige rij | copy zelf gekozen bij het bouwen (`locales/setupTv.ts`), geen bevoegde bron om over te nemen. Presentatietekst, geen spelregel |
| TvInitialPlacementScreen.tsx | Bij `activePlayerId === null` krijgt elk geclaimd gebied zijn eigen kleur op volle `own`-opaciteit i.p.v. het eigen/vijand-onderscheid van het Hoofdscherm | Geen exportwaarde — de export kent geen gelijktijdig-plaatsen-staat (zie vorige twee rijen) | bewuste designkeuze i.p.v. ontwikkelaarsfallback: zonder actieve speler is er geen zinvol "wie is eigen/vijand"-perspectief; de hele kaart op de gedimde `enemy`-stijl zetten zou lezen als "niets is van iemand". Nagevraagd/vastgesteld bij het bouwen (2026-08-03) |
| AttackFlowStep.tsx / DefendStep.tsx | Client clamt de dobbelsteen-steppers op `min(3, srcArmies-1)` resp. `defenderArmyCount===1 → alleen 1` | `AttackGuards.MaxAttackDice`/`CanChooseDefenseDice` (backend) kennen dezelfde vaste regels | de aanvalsdobbelsteen-clamp is een vaste Risk-constante toegepast op een servergetal (zelfde categorie als de `armiesRemaining`-clamp in `PlaceReinforcementStep.tsx`). De verdedigingsdobbelsteen-clamp is eerlijk gezegd wél een afgeleide regel (`min(MaxDefenseDice, defenderArmyCount)`), zij het triviaal met maar twee uitkomsten — de server blijft de enige plek die 'm afdwingt (`CanChooseDefenseDice`), dit is puur een UI-uitgrijzing. Nagevraagd/vastgesteld tijdens het bouwen (2026-08-03), zie het Attack-bouwplan |
| AttackFlowStep.tsx (`AttackRolledResult`) | Toont een korte "wachten op verdediger"-tussenstaat (worp al zichtbaar, resultaat nog niet) | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie; `atkRolled`) toonde dobbelstenen + resultaat in één keer — een client-only demo zonder server-round-trip | noodzakelijk gevolg van de echte twee-staps server-flow (`DeclareAttack` → `ChooseDefenseDice`, een andere speler): de aanvaller weet het defensieresultaat pas als de verdediger heeft gekozen. Zelfde categorie als de 3-staten-knop in `PlaceReinforcementStep.tsx` |
| AttackFlowStep.tsx / DefendStep.tsx | Reroll-blok (Generaal-rol) ontbreekt volledig | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie; `isAttack`) en de reroll-chip in de TV-combat-overlay toonden dit wél | bevestigd buiten scope met de gebruiker: er bestaat geen backend-command voor de reroll-dobbelsteen (zie het Attack-bouwplan, "Backend — geen functionele wijziging") |
| TvCombatOverlay.tsx | Geen kicker-tekst boven de eliminatie-headline | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie) gebruikte `{{ t.elimKicker }}`, maar die key ontbrak in de eigen NL/EN-vertaaltabellen van de export | ontbrekende bronwaarde in de export zelf — niet zelf ingevuld, zie `locales/attackTv.ts` |
| TvCombatOverlay.tsx | "VEROVERD"-badge toont geen meeverplaats-detail (`moveIn`, "Aanvaller verplaatst N legers naar X") | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie) toonde dat wel | er bestaat geen narratief server-event voor `MoveAfterConquest` (geen broadcast, alleen een stille `GameStateDto`-update) — de TV heeft dat aantal dus niet op het moment dat de badge zou moeten verschijnen. Bevinding, geen invulruimte |
| TvCombatOverlay.tsx | Eliminatie-headline toont de spelersnaam (bv. "Bob UITGESCHAKELD") i.p.v. een uppercased kleurwoord | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie) gebruikte `P[elimIdx].cw[0].toUpperCase()+' UITGESCHAKELD'` (een "callword" op basis van kleur) | ons datamodel kent geen "cw"/callword-equivalent — `PlayerDto.name` is de enige zinvolle identificatie; voor een spel met echte spelersnamen (i.p.v. anonieme gekleurde stukken in de demo) is dat bovendien functioneel beter. Nagevraagd noch expliciet bevestigd; gemeld als bevinding |
| TvCombatOverlay.tsx | Wissel resultaat → eliminatie-weergave is JS-gestuurd (2000ms na `CombatNarrated`) i.p.v. een CSS-`animation-delay` | Geen letterlijke exportwaarde: de demo wisselt handmatig via een "volgende"-knop (`replayTransition`, `overlayReplayHideMs`/`overlayReplayGapMs` in `motion.ts`), niet automatisch na een vaste tijd | dit is geen stagger binnen één scherm maar een wissel tussen twee losse overlay-content-blokken — expliciet voorziene uitzondering in het Attack-bouwplan op de "geen JS-timing tenzij het design het vereist"-regel. 2000ms zelf niet uit de export afgeleid, presentatiekeuze |
| TvCombatOverlay.tsx | Combat-houd-periode (hoe lang de overlay na afhandeling zichtbaar blijft) is 5000ms | Geen exportwaarde — de export kent geen houd-timer, alleen state-gedreven `sc-if` | nagevraagd bij de gebruiker (2026-08-03) en op 5000ms vastgesteld, zelfde soort presentatiebeslissing als `ORDER_ROLL_REVEAL_HOLD_MS` in `useHeldPhase.ts`. Zie `useHeldCombat.ts` |
| TvCombatOverlay.tsx | Rechterspelerpaneel (C12) en de reroll-chip ontbreken | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie) toonde beide in de combat-overlay | zelfde geaccepteerde scope-afbakening als op `TvMainBoardScreen` (geen deliverable in het goedgekeurde Attack-plan); reroll is bovendien hierboven al uitgesloten |
| ConquestMoveStep.tsx | Avatar-blok krijgt `mx-auto` toegevoegd (niet in de export) | (voormalige design-reference-export, verwijderd 2026-08-04 — zie git-historie) centreerde alleen via `text-align:center` op de ouder | echte layoutfout in de export zelf: `text-align:center` centreert tekst/inline-content, niet een blok-element met vaste breedte (56px) — bij een gebiedsnaam breder dan 56px (bv. "Northwest Territory") schuift de ouder mee met de tekst en blijft het avatarblok links hangen. Gemeld en op verzoek van de gebruiker gefixt (2026-08-04), niet stilzwijgend |
| index.css (globaal, alle interactieve elementen) | `button/a/input/select/[tabindex]:focus-visible` krijgt `outline: 2px solid var(--ring); outline-offset: 2px`, i.p.v. de `outline:none` zonder vervanging uit `twc-theme.css` L334-341 | De export onderdrukt de focus-outline volledig — `--ring` is daar wel gedefinieerd (`colors_and_type.css` L110/153) maar wordt nergens gebruikt, een kennelijke omissie | verbetert toetsenbord-/afstandsbedieningnavigatie op TV en telefoon (Impeccable-audit, 2026-08-04) zonder zichtbaar verschil bij muis-/touch-gebruik; geaccepteerd op basis van de flow-verbeteringsuitzondering |
| index.css (globaal, alle `text-fg`/`text-fg-secondary`/`text-fg-muted` binnen een `GlassPanel`/glas-`Button`, alle drie tiers incl. `overlay`) | Tekstkleur en `text-shadow` worden overschreven naar `--glass-fg`/`--glass-fg-secondary`/`--glass-fg-muted` (alle drie opaciteitstappen van hetzelfde `--fg1`-wit) plus een gedeelde donkere `text-shadow`, i.p.v. de standaard `--fg`/`--fg-secondary`/`--fg-muted`-grijstinten | Geen exportwaarde — de export kende geen glasmorfisme. `--fg-muted`/`--fg-secondary` zijn getuned voor een vlakke, donkere kaart en werden onleesbaar op de vervaagde, verzadigde (`saturate(1.4)`) stage-illustratie (bevinding, gebruiker gescreenshot 2026-08-11, PlaceReinforcementStep continent-rijen) | nagevraagd bij de gebruiker (2026-08-11) en zo vastgesteld: hiërarchie op glas zit voortaan in opacity i.p.v. hue-lightness, contrastvloer komt van de shadow, niet de kleur. **Correctie dezelfde dag:** oorspronkelijk alleen `base`/`raised` gescoped, ervan uitgaand dat `overlay` (modals) al donker genoeg was — bleek onjuist zodra bevestigd werd dat `GlassPanel` bewust géén achtergrondtint heeft (`--glass-bg` is expres nooit gezet, "clear glass", zie DESIGN.md § Elevation & Depth); een volledig-scherm combat-overlay ("GEVECHT"/"AANVALLER"/"VERDEDIGER") bleek daardoor bijna onleesbaar. Nu op alle drie tiers zonder uitzondering. Niet-glas tekst (opake surfaces) is onveranderd |
| TvPlaceholderScreen.tsx | Bericht staat nu in een `GlassPanel elevation="base" context="tv"` i.p.v. losse tekst direct op de stage-illustratie | Geen exportwaarde — dit scherm bestond niet in de (inmiddels verwijderde) design-reference-export | bevinding, gebruiker gescreenshot 2026-08-11: enige TV-scherm zonder `GlassPanel` én zonder eigen scrim-/text-shadow-behandeling, precies gecentreerd in de "ademband" waar `TvStageBackground`'s scrim bewust geen randalpha zet (DESIGN.md § Layout) — onleesbaar op lichtere delen van de foto. Nu conform de Glass-By-Default Rule zoals alle andere TV-schermen; `text-fg-muted` erin krijgt daarmee automatisch de on-glass tekstbehandeling (vorige rij) |
| AttackFlowStep.tsx (dobbelsteen-picker, `pickDice`) | De drie dobbelsteen-kaarten + de hint-tekst eronder staan nu samen in één gedeeld `GlassPanel elevation="base" context="phone"`; de losse kaarten blijven genest (nesting-guard schakelt hun eigen blur uit, rand blijft per kaart — geen tint, `GlassPanel` heeft er sowieso geen). Kleurstijlen op de cijfer-/labeltekst zijn van inline `style={{color:'var(--fg1/2/3)'}}` naar `text-fg`/`text-fg-secondary`/`text-fg-muted`-classes | Geen exportwaarde — de export kende geen glasmorfisme | bevinding, gebruiker gescreenshot 2026-08-11: drie los naast elkaar geblurde `GlassPanel`s vingen elk een ander stuk van de drukke stage-illustratie, waardoor de kaarten niet meer als één samenhangende keuzeset oogden, en de inline `var(--fg1/2/3)`-kleuren op de cijfers omzeilden de on-glass tekstbehandeling (twee rijen hierboven), die alleen `.text-fg*`-classes herkent. Zelfde onderliggende mechanisme als `DefendStep`'s dobbelsteen-picker (die al goed oogde omdat hij binnen `ModalShell` genest zit) — hier expliciet dezelfde structuur toegepast i.p.v. per-kaart blur |
| GlassPanel.tsx (geen wijziging, ter bevestiging) / index.css, DESIGN.md, .impeccable/design.json | `--glass-bg` (achtergrondtint) is en blijft bewust nooit gezet — `GlassPanel` is "clear glass": alleen blur/saturate + rand + top-highlight + schaduw, geen kleurwas. Eerder in deze sessie per ongeluk als regressie aangemerkt en hersteld — teruggedraaid nadat de gebruiker bevestigde dat dit opzet is (2026-08-11) | n.v.t. — bevestigde ontwerpkeuze, geen exportafwijking | DESIGN.md/de sidecar beschreven aanvankelijk (foutief, op basis van een verkeerde aanname) een "getinte glassurface"-systeem; gecorrigeerd naar "clear glass" na bevestiging. Dit verklaart ook waarom een volledig-scherm `GlassPanel elevation="overlay"` (combat-overlay) geen enkele verdonkering geeft — dat is het bedoelde gedrag, geen bug — en waarom de on-glass tekstbehandeling (twee rijen hierboven) naar alle drie tiers moest worden uitgebreid |
| ArmyStepperRow.tsx (beide `+`-knoppen) en PlaceReinforcementStep.tsx (`Klaar`/`Aanvallen`-knop) | Tekstkleur op de `+`/CTA-knop volgt nu de achtergrond (`canIncrement`/`buttonEnabled` ? `var(--on-pitch)` : `var(--fg-muted)`) i.p.v. altijd hardcoded `var(--on-pitch)` | Geen exportwaarde — de export kende geen conditionele achtergrondwissel op deze knoppen | bevinding, gebruiker gescreenshot 2026-08-11 (Versterken-scherm, uitgeschakelde `+`-knoppen): `--on-pitch` (bijna zwart, `#04060b`) is getuned voor tekst op de volledig dekkende `pitch-500`-groenvulling; deze knoppen wisselen bij uitgeschakeld naar `var(--border-strong)` (`#33425a`, donker blauwgrijs) als achtergrond maar behielden de bijna-zwarte tekst erop — vrijwel onleesbaar. Zelfde categorie bug als de eerder opgeloste `Button.tsx`-bevinding (2026-08-07), hier gemist omdat deze knoppen die styling los herhalen i.p.v. `Button` te hergebruiken. Overige `var(--on-pitch)`-knoppen in de codebase (`AttackFlowStep`/`TurnStatusHeader`/`ConquestMoveStep`/`LobbyQrPanel`/`Stepper`) dimmen uitsluitend via `disabled:opacity-*` op een statische `bg-pitch-500` — achtergrond én tekst faden samen, dus geen vergelijkbaar contrastprobleem, niet aangepast |

## Bevinding: TO §4.1 belooft `SetAutoPass`, backend levert het niet

`docs/technisch-ontwerp-risk.md` §4.1 noemt `SetAutoPass` (host-command voor een
afwezige speler) en een `isAutoPass`-veld op de speler-schets — maar `PlayerDto.cs`
heeft dat veld niet en er bestaat geen `SetAutoPass`-hub-method in `GameHub.cs`.
Gecombineerd met de bewust gepauzeerde beurttimer tijdens een gevecht (FO §5.4, want
`ChooseDefenseDice` pauzeert tot een gevecht volledig is afgehandeld): **een
verdediger die nooit reageert blokkeert het spel voor iedereen**, zonder vangnet.
Niet opgelost in deze taak (bestaand gat, niet door Attack geïntroduceerd) — voor het
eerst met echte spelers bereikbaar zodra deze taak live gaat. Vervolgtaak: ofwel
`SetAutoPass` alsnog bouwen, ofwel de TO bijwerken als dit bewust nooit komt.


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

- Alleen Tailwind-utilities en de tokens uit `frontend/src/styles/` — geen losse
  CSS-bestanden, geen zelfverzonnen kleuren buiten `colors.json` en het design system.
- Levert de export een waarde die geen exacte Tailwind-utility heeft, dan gaat de
  exacte waarde vóór de utility: arbitrary value (`gap-[18px]`) of een token uit
  `design-tokens.ts`. Afronden naar de dichtstbijzijnde utility is een afwijking en
  hoort in de afwijkingenlijst.
- Keyframes uit de export komen in de Tailwind-config (`theme.extend.keyframes` /
  `animation`), afgeleid van `motion.ts` — niet als los CSS-bestand.