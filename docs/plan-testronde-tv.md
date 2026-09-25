<!-- Werkplan, geen changelog: git-commits blijven de enige wijzigingslog (CLAUDE.md). -->
<!-- Oorsprong: TV-testronde + onderzoekssessie 2026-09-23; beslissingen door de gebruiker dezelfde dag. Status: VASTGESTELD. -->

# Plan: bevindingen TV-testronde

Acht bevindingen uit een testspel op een echte TV. Eén punt per sessie, in de volgorde
van §1. Vink een punt pas af als code, tests en (waar genoemd) FO/`DESIGN.md` bijgewerkt zijn.

## 1. Volgorde en afvinklijst

- [x] **5** — Missie "18 gebieden met ≥ 2 legers" alleen bij 4+ spelers
- [ ] **6** — Streep in de "V" van "VS" op het TV-gevechtsoverlay (TV-verificatie nog open)
- [x] **1** — Legerstand van de verdediger tonen op de telefoon
- [x] **8** — Engelse teksten tussen de Nederlandse (de open bevinding "Engels onbereikbaar zonder taalknop" is opgelost via de NL/EN-toggle van punt 2)
- [x] **7** — Lobby-instelling dobbelregel + nieuwe verdedigingsrollen (Brazilië/Indonesië/IJsland)
- [ ] **2** — TV-weergave-instellingen (tekstschaal, glas) vanaf de host-telefoon (code, tests en `DESIGN.md` af; echte-TV-check op slider 0/50/100 nog open)
- [ ] **4** — Nieuwsbanner met de laatste 10 acties op de TV (code, tests en `DESIGN.md` af; echte-TV-check op leessnelheid en tekstschaal nog open)
- [x] **3** — Spelinfo op de telefoon

Kleine, afgebakende fixes eerst; 4 is het grootste werk en 3 leunt deels op dezelfde
stand-/catalogusdata.

## 2. Punten

### 5. Missie `territory-18-min2` alleen bij 4+ spelers

**Oorzaak.** De missie zit niet alleen in de trekpool, maar is ook `fallbackMissionId` van
`eliminate-green` en drie andere eliminate-missies. Bij 2 spelers doen die kleuren niet mee,
dus komt een speler via de fallback alsnog op deze missie uit
([MissionAssignmentCalculator.cs](../src/RiskGame.Rules/Missions/MissionAssignmentCalculator.cs), `Resolve`).

**Aanpak.**
- [x] `missions.json`: veld `"minPlayers": 4` op `territory-18-min2` (data-driven, niet in C#).
- [x] `MissionDefinition` + `MapDefinitionParser`: `MinPlayers` inlezen (optioneel, default geen minimum).
- [x] `MissionAssignmentCalculator.Assign`: pool filteren op spelersaantal; is de fallback bij dit
      aantal niet toegestaan → `territory-24`.
- [x] `MissionPoolIsLargeEnough` rekent met de gefilterde pool.
- [x] Tussentijdse fallback (`ResolveFallbacksAfterElimination`): het spelersaantal **bij de start** telt.
- [x] FO §6.1 bijwerken.
- [x] Unit tests voor 2, 3 en 4 spelers (pool én fallback).

**Nabewerking (zelfde sessie).** De aanpak-bullets hierboven beschreven nog een vaste
`fallbackMissionId` per eliminate-missie met `territory-24` als vangnet bij een niet-toegestaan
spelersaantal. Op verzoek van de gebruiker is dat mechanisme vervangen: `fallbackMissionId`
bestaat niet meer, en `MissionAssignmentCalculator` kiest zelf willekeurig een nog ongebruikte
`ConquerContinents`-missie als fallback — dat voorkomt dat twee spelers dezelfde fallback-missie
krijgen (wat met de oude, vaste fallback-ketens wél kon gebeuren). Zie FO §6.1 en
`MissionAssignmentCalculator.cs` voor de huidige stand.

### 6. Streep in de "V" van "VS"

**Bevinding (screenshot 2026-09-23).** De blauwe lijn zit ín de letter V. De tekst staat als
kleine letters `vs` in [attackTv.ts:13](../frontend/src/locales/attackTv.ts#L13); het merk-lettertype
toont die als hoofdletters maar gebruikt de tekening van de kleine `v`, met die schuine streep.
"VEROVERD" (zelfde font, zelfde gewicht, wél hoofdletters in de locale) heeft schone V's.
Er zit geen rand of scheidingslijn in de layout van [TvCombatOverlay.tsx](../frontend/src/routes/tv/screens/TvCombatOverlay.tsx).

**Aanpak.**
- [x] Locale `vs` → `'VS'` (nl en en).
- [ ] Controleren op TV of screenshot. Blijft de streep: glyph in `brand-font.ttf` controleren of
      "VS" een lichter gewicht geven.
- [x] Andere kleine-letterteksten in `font-display` zoeken en ook in hoofdletters zetten. Eén
      gevonden: `common.badges.comingSoon` ("binnenkort"/"coming soon", `ToggleRow.tsx`'s
      `soon`-badge, erft `font-display` van de omringende rij) — nu `'BINNENKORT'`/`'COMING SOON'`,
      conform DESIGN.md's Label-regel (badges altijd uppercase). Prop `soon` heeft momenteel geen
      enkele aanroeper (dode functionaliteit, niet door deze taak geïntroduceerd). Overige
      korte kleine-letterteksten (`armiesWord`, `targetsWord`, `diceWord*`, `colTerr`, `you`,
      `roleActive`/`roleInactive`) staan op `font-body`/`text-sm` e.d., niet op `font-display` —
      `roleActive`/`roleInactive` zijn bovendien expliciet als bewuste uitzondering gedocumenteerd
      (DESIGN.md, "Player Header / Stat rows").

### 1. Legerstand van de verdediger op de telefoon

**Nu.** [DefendStep.tsx](../frontend/src/components/DefendStep.tsx) krijgt `defenderArmyCount` al
binnen, maar gebruikt het alleen voor de 1-dobbelsteenregel.

**Aanpak.**
- [x] Regel onder de kleurblokken: "Jouw legers op {gebied}: N", eventueel ook het aantal legers
      van de aanvaller in het brongebied (staat al in de state).
- [x] Nieuwe keys in `locales/attack.ts` (nl + en).
- [x] Test in `DefendStep.test.tsx`.

**Uitvoering.** Nieuwe regel (`font-body text-sm text-fg-muted`) direct onder de kleurblokken,
vóór de bestaande `defend.line`-narratief: `"Jouw legers op {gebied}: N · Aanvaller vanuit
{brongebied}: M"` — zelfde middle-dot-idioom als DESIGN.md's "Player Header / Stat rows"
(gedocumenteerd voor een vergelijkbare tweede-stat-inline-situatie). Nieuwe verplichte prop
`attackerArmyCount` op `DefendStep`/`HeldDefend`, afgeleid in `PhoneAttackScreen.tsx` uit
`state.territories` op `fromTerritoryId` — geen nieuwe DTO nodig, stond al in de state (frontend/
CLAUDE.md: geen client-side spelregelafleiding, dit is alleen weergave van een bestaand getal).
Nieuwe keys `defend.myArmies`/`defend.attackerArmies` in `locales/attack.ts`. Test toegevoegd in
`DefendStep.test.tsx`; bestaande renders kregen de nieuwe verplichte prop erbij.

**Bugfix (elite-code-review, 2026-09-24).** De legerstand-regel stond buiten de
`result === null`-conditional en bleef dus ook zichtbaar ná het gevechtsresultaat — met
`defenderArmyCount`/`attackerArmyCount` bevroren op de stand van vóór de worp, terwijl de
dobbelstenen/uitkomst eronder al de nieuwe werkelijkheid toonden (bv. "Jouw legers op
Kamtsjatka: 3" naast "Je verliest 2 legers"). Verplaatst in de `result === null`-tak, samen
met de `choose`/`awaitingReroll`-regel; nieuwe test bewaakt dat de regel verdwijnt zodra het
resultaat verschijnt.

### 8. Engelse teksten tussen de Nederlandse

**Oorzaken.**
1. **Taaldetectie:** i18n kiest via `localStorage` → `navigator`, en er is nergens een taalknop.
   Staat de TV-browser op Engels, dan is de hele TV Engels ([i18n/index.ts](../frontend/src/i18n/index.ts)).
2. **Engels in `nl`-leaves:** o.a. "Random" (3×), "Host"/"HOST".
3. **Hardcoded tekst en backend-strings** (zie `docs/i18n-inventory.md` §3).

**Beslissing.** Bewuste Engelse grappen in rolbeschrijvingen ("USA! USA! USA!",
"Diplomacy under a cup of tea!", "Koning Henry the 3th") blijven staan; alleen
"the 3th" wordt "the 3rd".

**Aanpak.**
- [x] Taal standaard op `nl` vastzetten; browsertaal niet meer gebruiken (`en` blijft beschikbaar).
- [x] Inventaris van alle Engelse UI-teksten met voorgestelde vertaling → ter goedkeuring aan de gebruiker.
- [x] Na akkoord in één keer vervangen.
- [x] Test in `locales/index.test.ts` die veelvoorkomende Engelse woorden in `nl`-leaves opspoort
      (met uitzonderingslijst voor de grappen).

**Uitvoering.**
- `i18n/index.ts`: detectie-`order` teruggebracht tot `['localStorage']` — zonder opgeslagen
  keuze valt het altijd terug op `fallbackLng: 'nl'`, nooit meer op `navigator`. `en` blijft
  bereikbaar via `useLocale().setLang` (bestond al, alleen nog nergens aan een knop gekoppeld —
  buiten scope van deze bevinding, geen UI gevraagd in de aanpak-bullets).
- `docs/i18n-inventory.md` (waar de Aanpak oorspronkelijk naar verwees) bestaat niet meer in de
  repo — inventaris opnieuw vanaf de code opgebouwd i.p.v. dat bestand te volgen.
- Inventaris + akkoord van de gebruiker (2026-09-24):
  - **"Host"/"HOST"** (common.ts, join.ts) — laten staan: geaccepteerd Nederlands leenwoord,
    consistent met bestaand gebruik elders (errors.ts "De host kan niet verwijderd worden.",
    CLAUDE.md "host-telefoon"). Geen wijziging.
  - **"Random"** (3×: createGame.ts, lobby.ts ×2) → **"Willekeurig"**.
  - **5 onvertaalde gebiedsnamen** in `territories.ts` (inconsistent met de overige 38, en met
    quotes.ts dat al "West-Australië"/"Oost-Australië" gebruikte) → Northwest Territory
    **Noordwest-Territorium**, Western/Eastern United States **West-VS/Oost-VS** (matcht de
    afkorting die `roles.president` al gebruikte), Western/Eastern Australia
    **West-Australië/Oost-Australië**.
  - Bijvangst tijdens het doorvoeren: `roles.ts` had 5 rolomschrijvingen die deze (en de al wél
    vertaalde "Ukraine"/"New Zealand") namen onvertaald in de nl-tekst lieten staan
    (`kolonist`, `aboriginal`, `cowboy`, `tsaar`, `maori` — `maori` noemde zelfs "New Zealand" én
    "Nieuw-Zeeland" in dezelfde zin). Mee opgelost, zelfde categorie fout, geen aparte
    goedkeuring gevraagd (ondubbelzinnig, matcht een al bestaande vertaling elders).
  - **`errors.ts` `useEndTurnInFortify`** noemde de rauwe hub-methode "EndTurn" i.p.v. de
    knoptekst → geherformuleerd naar `"Beurt beëindigen"` (nl) / `"End turn"` (en), match met
    `fortify.ts`'s `endTurn`/`skipTurn`.
  - **"the 3th" → "the 3rd"** (quotes.ts, `quote-279`, Koning Henry-grap) — al gefixt vóór de
    inventarisatie, onderdeel van dezelfde bevinding.
- Nieuwe test `locales/index.test.ts`: klein, hoog-precisie Engels-woordenlijstje (alleen woorden
  die geen geldig Nederlands woord zijn, dus geen false positives op cognaten als "in"/"is"/"of"),
  met `{{variabele}}`-interpolatie eerst gestript. Eén uitzondering: `quotes:quote-279.author`
  (de "Henry the 3rd"-grap, bevat "the"). "Host"/"random" bewust in/uit de lijst gehouden zoals
  hierboven besloten.
- `ToggleRow.test.tsx` bijgewerkt op de eerder in deze sessie (punt 6) al doorgevoerde
  `'binnenkort'` → `'BINNENKORT'`-wijziging (was nog niet in de test verwerkt).
- `pnpm run build` en de volledige testsuite (3799 tests) zijn groen.

**Bevinding (elite-code-review, 2026-09-24) — Engels in de praktijk onbereikbaar, opgelost
via punt 2.** `useLocale().setLang` bestaat, maar heeft nul aanroepers in de hele frontend:
er is nergens een taalknop. Vóór deze sessie kon een speler met een Engelse browser/TV via
`navigator`-detectie tenminste Engels krijgen; ná het verwijderen van `'navigator'` uit de
detectie-`order` is de enige weg naar `en` handmatig `localStorage` zetten via devtools. De
aanpak-bullet "`en` blijft beschikbaar" klopt dus alleen technisch (de resource/vertaling
bestaat), niet functioneel. **Besluit (2026-09-24):** geen aparte taalknop hier — een kleine
NL/EN-toggle voor de TV verhuist naar punt 2 se "TV-weergave-instellingen vanaf de
host-telefoon", die toch al een host-only bedienpaneel + server→TV-doorgifte bouwt. Zie
punt 2 voor de uitwerking.

### 7. Dobbelregel als lobby-instelling + verdedigingsrollen (Brazilië/Indonesië/IJsland)

**Let op.** Wijkt af van FO §5.3 (verdediger kiest altijd 1–2) en van de officiële Risk-regels
(verdediger mag 2 gooien vanaf 2 legers, ongeacht de aanvaller). Bewuste huisregel.

**Beslissingen.**
- Nieuwe lobby-instelling: **Huisregel** (aanvaller gooit 1 → verdediger ook 1) of **Klassiek**.
  Standaard: **Huisregel**.
- **Drie** nieuwe rollen — geen rol met 3 herkomstlanden, dat past niet in het bestaande
  `roles.json`-schema (één `originTerritory` per rol) — met herkomstland **Brazilië**,
  **Indonesië** resp. **IJsland**, zelfde effect (bevestigd 2026-09-24, zie voorstel
  hieronder): één keer per ronde toch met 2 dobbelstenen verdedigen tegen een aanval met 1;
  weer beschikbaar **aan het begin van de eigen beurt** van de verdediger. Alle drie
  herkomstlanden zijn vrij (geen bestaande rol gebruikt ze).
- Bij **Klassiek** vallen deze rollen uit de pool (niet uitgedeeld, niet kiesbaar) — zelfde
  soort pool-filtering als punt 5 al deed voor `territory-18-min2`.
- Naam en flavourtekst: voorstel door Claude, goedkeuring door de gebruiker.

**Voorstel rolnamen/flavourtekst (ter goedkeuring).** Zelfde effect-type (`DefenseBoost`),
naar het patroon van de bestaande `Reroll`-rollen die ook zonder parameters, meerdere keren,
hetzelfde effect delen (Generaal/Admiraal/Aboriginal/Samurai/Cowboy/Maori):

| Rol | Herkomstland | Naam (NL/EN) | Flavourtekst (NL) |
|---|---|---|---|
| Brazilië | `brazil` | Capoeirista / Capoeirista | "Ginga in de verdediging: één keer per ronde toch met 2 dobbelstenen verdedigen tegen een aanval met 1 dobbelsteen, zolang je Brazilië bezit." |
| Indonesië | `indonesia` | Pendekar / Pencak Silat Master | "Een silat-meester wijkt niet voor een enkele aanvaller: één keer per ronde toch met 2 dobbelstenen verdedigen tegen een aanval met 1 dobbelsteen, zolang je Indonesië bezit." |
| IJsland | `iceland` | Berserker / Berserker | "Woede kent geen dobbelsteenlimiet: één keer per ronde toch met 2 dobbelstenen verdedigen tegen een aanval met 1 dobbelsteen, zolang je IJsland bezit." |

**Aanpak.**
- [x] FO §5.3 (stap 4, dobbelregel-instelling), §8.1 (nieuw effect-type `DefenseBoost`) en §10
      (nieuwe instellingsrij) bijwerken — eerst, conform CLAUDE.md.
- [x] **Rules** (`src/RiskGame.Rules`): enum `DefenseDiceRule` (`HouseRule`/`Classic`, stijl
      `RoleAssignmentMode.cs`) + veld op `GameSettings` (default `HouseRule`, stijl
      `MissionWinTiming`). Nieuw `DefenseBoostEffect : RoleEffect` (geen parameters, stijl
      `RerollEffect`) + `case "DefenseBoost"` in `MapDefinitionParser.ReadRoleEffect`.
      `roles.json` uitbreiden met de 3 rollen.
- [x] **`Player.cs`**: nieuw veld `bool DefenseBoostUsed = false`. Op `Player`, niet op
      `TurnState`: `TurnState` wordt bij elke `PhaseChanged` volledig herbouwd en bestaat
      alleen voor de actieve speler, terwijl de boost moet overleven tot de *verdediger*
      (een andere speler) zelf weer aan de beurt komt.
- [x] **Gedeelde rolpool-helper** (bv. `Roles/RolePool.EffectiveRoles(GameState)`) die
      `state.Map.Roles` filtert op `DefenseDiceRule`; vervangt de ongefilterde catalogus op
      de 3 plekken die 'm vandaag gebruiken: `LobbyGuards.RolePoolIsLargeEnough`,
      `LobbyCommandHandler`'s `RoleAssignmentCalculator.Assign`-aanroep, en
      `GameStateDtoMapper`'s rollen→DTO-mapping (dekt zowel TV-roster als de
      "Kiezen"-stap — server filtert, client filtert nooit zelf, zelfde patroon als de
      bestaande Maori-uitsluiting "alleen op kaartvarianten met Nieuw-Zeeland").
- [x] **`AttackGuards.CanChooseDefenseDice`**: nieuwe parameter `bool useDefenseBoost`. Bij
      `defenseDice == 2`, `DefenseDiceRule.HouseRule` én `pendingCombat.AttackDice == 1` moet
      `useDefenseBoost` waar zijn, `RoleEffects.Active<DefenseBoostEffect>` actief, én
      `Player.DefenseBoostUsed` nog `false` — anders faalt de guard met één nieuwe foutcode
      `attack.mustDefendWithOneDieHouseRule` (bewust één code: een client die de boost
      aanbiedt terwijl hij niet beschikbaar is, is sowieso verouderd/fout).
- [x] **Nieuw event** `DefenseBoostUsed(gameId, playerId)` — apart feit naast de bestaande
      combat-events, niet erop geplakt. Projectie zet `Player.DefenseBoostUsed = true`.
      **Reset**: in het bestaande `Apply(GameState, PhaseChanged)`, wanneer
      `@event.TurnPhase == TurnPhase.Reinforce`, ook `Player.DefenseBoostUsed` van díe
      speler terugzetten — zelfde "alleen bij intrede in Versterken reset ik" als
      `HasConqueredThisTurn` ernaast, maar op `Player` i.p.v. `TurnState`.
- [x] **Api**: `GameSettingsDto`/`DefenseDiceRuleDto` + mapper (stijl `RoleAssignmentModeDto`).
      `PlayerDto.DefenseBoostAvailable` (server-berekend, nooit client-side herleiden — zelfde
      rol als het bestaande `IsRoleActive`). `AttackCommandHandler.ChooseDefenseDiceAsync` +
      `GameHub.ChooseDefenseDice`: extra parameter, boost-event bij geslaagd gebruik. De
      bestaande `DiceRolledMessage`-broadcast voor de verdedigingsworp krijgt
      `context: "defenseBoost"` i.p.v. `"defense"` zodra ingezet — zelfde mechanisme als
      `"reroll"` vandaag, geen nieuw broadcast-type nodig.
      `locales/errors.ts`: nieuwe key `attack.mustDefendWithOneDieHouseRule`.
- [x] **Frontend**: `CreateGameForm`/`locales/createGame.ts` — nieuwe instelling, 2-opties-
      `SegmentedControl` naar het patroon van `winCondition`. `LobbySettingsSummary`/
      `locales/lobby.ts` — samenvattingsregel. `locales/roles.ts` — 3 nieuwe entries.
- [x] **`DefendStep`**: bij gedwongen 1 (nu alleen `defenderArmyCount===1`) geldt voortaan ook
      `defenseDiceRule==='houseRule' && attackDice===1 && !defenseBoostAvailable`. Is de boost
      wél beschikbaar, dan blijft het "2"-kaartje klikbaar met een boost-indicator (rolnaam +
      icoon, zelfde soort als het reroll-aanbod in `AttackFlowStep.tsx`'s
      `AttackRolledResult`, DESIGN.md § Role Reroll) i.p.v. de normale styling; kiezen roept
      `onChooseDefenseDice(2, true)` aan (signatuur krijgt optionele tweede parameter).
      `PhoneAttackScreen`/hub-hook geven `attackDice`/`defenseBoostAvailable` door, zelfde plek
      als de bestaande `defenderArmyCount`/`attackerArmyCount`-afleiding (punt 1 hierboven).
- [x] **TV**: boost-inzet zichtbaar in `TvCombatOverlay`. `useCombatBroadcast.ts` krijgt een
      vierde toegestane `context` (`'defenseBoost'`) en zet een `defenseBoostUsed: boolean`
      op de combat-state (net als `reroll`, maar zonder extra payload — een vlag volstaat).
      Nieuw UI-element zonder DESIGN.md-precedent → korte `/impeccable document`-toevoeging
      achteraf (zelfde aanpak als de al gedocumenteerde § Role Reroll-sectie).
- [x] **Tests**: `AttackGuardsTests` (Huisregel-forceert-1, met/zonder actieve/gebruikte
      boost, Klassiek ongewijzigd), rolpool-filtering + `RolePoolIsLargeEnough` op de
      gefilterde pool, projectie (`DefenseBoostUsed`-apply + reset bij de juiste speler, niet
      bij een andere speler wiens beurt eerder begint), hub/command-handlertest inclusief de
      foutcode-respons, `DefendStep.test.tsx`/`PhoneAttackScreen.test.tsx`/
      `CreateGameForm.test.tsx`/`LobbySettingsSummary.test.tsx`/`TvCombatOverlay.test.tsx`.

**Aanbevolen sessie-opdeling** (CLAUDE.md: "één taak per sessie, klein houden" — dit punt is
te groot voor één sessie), elk met eigen build/tests-groen als afrondingscriterium: (1) FO,
(2) Rules-engine + tests, (3) Api (DTO/event/projectie/hub) + tests, (4) Frontend
(instelling + DefendStep/PhoneAttackScreen) + tests, (5) TV + DESIGN.md + test.

**Uitvoering (2026-09-24).** Op verzoek van de gebruiker ("doe alles maar gelijk") sessies 2–5 in
één keer, na sessie 1 (FO). Afwijkingen/aanvullingen t.o.v. de bullets hierboven:
- De rolpool-helper heet `RolePool.EffectiveRoles` en wordt op **vier** plekken gebruikt, niet
  drie: ook `LobbyGuards.RoleIsKnown` (anders was een DefenseBoost-rol bij Klassiek via
  `ChooseRole` alsnog kiesbaar).
- `CanChooseDefenseDice` kreeg naast `useDefenseBoost` twee publieke helpers:
  `DefenseBoostAvailable` (ook voor `PlayerDto.DefenseBoostAvailable`) en
  `DefenseBoostRequired` (de handler verbruikt de boost alleen als die echt nodig was — een
  `useDefenseBoost: true` bij Klassiek of tegen 2+ aanvalsdobbelstenen is zonder effect).
- `GameHub.ChooseDefenseDice` heeft de parameter **verplicht** (SignalR kent geen optionele
  hub-parameters); de bestaande hub-tests sturen expliciet `false` mee.
- `DefendStep` krijgt `houseRuleLimitsToOneDie` + `defenseBoostRoleId` i.p.v. losse
  `defenseDiceRule`/`attackDice`/`defenseBoostAvailable`-props; de afleiding zit in
  `PhoneAttackScreen`, zelfde plek als de legerstanden.
- `DESIGN.md` § Role Defense Boost is met de hand toegevoegd; `/impeccable document` (sidecar
  `.impeccable/design.json`) is nog niet gedraaid.
- `data/maps/standaard-43/roles.json` (18 rollen) en FO §13 bijgewerkt; `Standaard43Tests`
  telt nu 18 rollen.

### 2. TV-weergave-instellingen vanaf de host-telefoon

**Nu.** Tekstgroottes zijn `rem`-CSS-variabelen (`--text-*` in `twc-theme.css`); glas loopt via
`--glass-bg` / `--glass-filter` in [GlassPanel.tsx](../frontend/src/components/ui/GlassPanel.tsx).

**Beslissing.** Bediening op de **telefoon van de host**; de server stuurt de waarden naar de TV,
zodat ze blijven staan na herladen van de TV. **Toegevoegd (2026-09-24, elite-code-review
punt 8):** hetzelfde paneel krijgt ook een kleine **NL/EN-taaltoggle voor de TV** — lost de
"TV staat stilzwijgend in het Engels"-bevinding (punt 8) definitief op via een expliciete,
host-bediende knop i.p.v. (afwezige) browserdetectie. Alleen de TV, niet de losse
telefoonschermen — die blijven op hun eigen `useLocale`/`localStorage`-mechanisme, dat
verandert hier niet.

**Aanpak.**
- [x] Backend: hub-methode (alleen host) + opslag in de state + meesturen in `GameStateDto`.
      Taal hoort in dezelfde payload/hub-methode als tekstschaal/glas (één "TV-weergave"-
      instellingenset), niet als los mechanisme.
- [x] `TvShell`: `--tv-text-scale`, `--tv-glass-opacity`, `--tv-glass-blur`; `--text-*` alleen
      binnen de TV-shell overschrijven, telefoon ongemoeid.
- [x] `GlassPanel` (`context="tv"`): tint en blur vermenigvuldigen met de variabelen.
- [x] **Taal:** de TV-route roept bij het laden/bij state-updates `i18next.changeLanguage`
      aan op basis van het server-veld i.p.v. de gebruikelijke `localStorage`/`fallbackLng`-
      detectie (`i18n/index.ts`) — de TV is de ene plek waar de servertoestand de taal
      bepaalt, niet de browser. **Bijgesteld (elite-code-review 2026-09-24, bevinding 6):**
      alleen `i18n.changeLanguage`, níet `useLocale().setLang` — die schrijft ook naar dezelfde
      `localStorage`-key als de telefoonroute, terwijl de server hier de bron is.
- [x] Host-telefoon: menu "TV-weergave" met schuifregelaars, NL/EN-toggle, en reset. Met een
      **eigen onderdeel "Dobbelstenen"** (besluit gebruiker 2026-09-24, zie "Uitvoering TV-kant").
- [x] `DESIGN.md` bijwerken via `/impeccable document`. Samengevoegd (2026-09-24): nieuwe
      subsectie Layout → TV display settings, The Scalable Type Rule, componenten Slider en
      TV Display Panel/access, host-actie + `TvIcon` in de header, dobbelsteen-schaling. Op
      verzoek van de gebruiker meteen ook de glas-drift van 2026-09-22 hersteld (clear glass →
      getint glas, blur 14/32/44, saturate 1.0, on-glass-tekst 90/75%). Sidecar mee bijgewerkt.
      **Bevinding, open:** `Button.tsx` zet sinds e43cad2 (2026-09-16, zonder motivering)
      `--glass-shadow: 'none'`, terwijl DESIGN.md's One Glow Rule de primaire knop de pitch-gloed
      geeft (`AttackFlowStep` en `ConquestMoveStep` hebben wél een gloed op hun eigen knoppen).
      Kort hersteld en weer teruggedraaid: de gebruiker twijfelt of de gloed een goed idee is.
      Code en spec wijken hier dus af tot er een besluit is.
- [x] Tests (incl. taaltoggle: hub-methode, DTO-veld, TV past de taal toe).

**Beslissingen (2026-09-24, bij het bouwplan).** Nieuw `ui/Slider`-component; slider 0–100 in
stappen van 5, 50 = het huidige design, 0 = 25% van het huidige effect, 100 = 2×; knop in de
host-header én op `JoinHostWaitStep`; opslag als event op de spelstream; de host-telefoon
onthoudt de laatste waarden en stuurt ze mee bij "Nieuw spel"; standaardwaarden komen uit het
DTO (`TvDisplayDefault`). Echte-TV-check op slider 0/50/100 hoort bij de afronding.

**Uitvoering backend (2026-09-24).** `TvDisplaySettings` (Rules, sliderposities als int) op
`GameState`; event `TvDisplaySettingsChanged`; optioneel `TvDisplay` op `GameCreated`/
`CreateGameRequest`; hub-methode `SetTvDisplay` (host, elke fase, `TvDisplayGuards`, foutcode
`tvDisplay.invalidValue`); `GameStateDto.TvDisplay` + `TvDisplayDefault`. `TvDisplayCommandHandler`
probeert een botsende gelijktijdige append tot 3× opnieuw — zonder die retry faalt de
gelijktijdigheidstest 5 van de 5 keer. **Bevinding, buiten scope:** de overige command
handlers hebben diezelfde botsingskans zonder retry. TO §4.1 bijgewerkt.

**Uitvoering TV-kant (2026-09-24).** Afwijkend van de bullets hierboven: geen `--tv-*`-CSS-
variabelen met `calc()`, maar kant-en-klare waarden in JS (elite-code-review bevinding 2 —
een ongeldige `calc()`/`min()` in een kleur-alpha valt op oudere TV-browsers stil terug op
doorzichtig glas).
- `styles/tvDisplay.ts` (`sliderToMultiplier`) is de enige plek met de omrekenformule.
- `TvShell` (prop `display`) zet elke `--text-<stap>` uit `fontSize` als letterlijke `rem`, en
  levert de glas-factoren via `TvGlassScaleContext`.
- `GlassPanel` met `context="tv"` schaalt daarmee tint (`scaleGlassSurfaceAlpha`, begrensd op 1)
  en blur. Buiten een `TvShell` met instelling, en op de telefoon, blijft alles op het design.
- `useTvLanguage` zet de TV-taal met alleen `changeLanguage`. `i18n/index.ts` staat nu op
  `caches: []`: de detector schreef anders bij élke `changeLanguage` naar `localStorage`, ook
  zonder `setLang`. `setLang` slaat een telefoonkeuze nog steeds zelf expliciet op.

**Nabewerking TV-kant (2026-09-24, besluiten gebruiker).** Eerst als beperking gemeld, daarna op
verzoek opgelost:
- **Tailwind-standaardgroottes → typeschaal.** De 5 plekken met `text-lg`/`text-xl`/`text-2xl`
  (`TvClaimingScreen`, `TvMainBoardScreen`, `TurnStatusHeader`, 2× `TvCombatOverlay`) staan nu op
  de pixel-gelijke `sizeN`-stap (18/20/24px → `size2`/`size4`/`size5`), met Tailwinds eigen
  regelhoogte letterlijk overgenomen waar geen `leading-*` stond. Op 50 verspringt er niets.
- **Kaartmarkers** schalen mee met de tekstschaal, en wel als geheel (`scaledMarker`/
  `scaledClaimMarker`): schijf, ring, legertal, naam, contour, afstand tot de naam, en bij claimen
  ook symbool en flare-ring. Alleen het getal schalen zou het uit de schijf laten lopen. De randen
  van de gebiedspolygonen horen bij de kaart en schalen niet.
- **Lobby-badge** volgt glasdekking en -blur.
- **Dobbelstenen: eigen instelling `diceScale`** (backend: veld op `TvDisplaySettings`/event/DTO/
  hub, optioneel met default 50). Een TV-`Dice` schaalt als geheel: maat, radius, padding, pips,
  rand, blur, schaduw en perspectief. Het gevechtsraster (`TvCombatOverlay`) en de wachtplek in
  `OrderRollTvPanel` reserveren dezelfde geschaalde maat, zodat `VS` en de rijen op hun plek
  blijven. Tussenruimtes tussen dobbelstenen en de invliegbaan (`atlasTumble`, `motion.ts`,
  bevroren) schalen niet: die horen bij het scherm, niet bij de dobbelsteen. Telefoon-dobbelstenen
  blijven ongemoeid. Het menu krijgt er een eigen onderdeel voor (zie aanpak-bullet).
- De glas-context heet nu `TvDisplayScaleContext` (alle factoren, `hooks/`), te lezen met
  `useTvDisplayScale`.

**Resterend:** `InstructionKicker` schaalt alleen in blur, want hij zet een eigen merk-tint over
`--glass-bg` heen.

**Uitvoering host-telefoon (2026-09-24).**
- `TvDisplayPanel`: full-screen `ModalShell` (zelfde patroon en `z-50` als `MissionPanel`) met
  drie onderdelen — Scherm (tekstgrootte, dekking, vervaging), **Dobbelstenen** (eigen
  onderdeel) en Taal op de TV (NL/EN-`SegmentedControl`) — plus "Standaard" (stuurt
  `tvDisplayDefault`, uitgeschakeld zolang alles al op de default staat) en "Sluiten". Geen
  optimistic update.
- Nieuw `ui/Slider` op een native `<input type="range">`, alleen bestaande tokens
  (`accent-pitch-500`, `min-h-13`, body-label, tabular-numeral-waarde). Commit via het native
  `change`-event: één event op de spelstream per afgeronde keuze, niet per pixel.
- Nieuw `TvIcon` (lijnstijl, 16×16) in `ui/icons.tsx`.
- Bereikbaar via een actie in `PhonePlayerHeader` die alleen de host ziet (geen uitgeschakelde
  knop voor anderen) en via een secundaire knop "TV-weergave" boven "Start spel" op
  `JoinHostWaitStep`.
- `useGameState.setTvDisplay` onthoudt na bevestiging de server-respons
  (`storage/rememberedTvDisplay.ts`, key `riskop:tvDisplay`); `CreateGameForm` stuurt een geldige
  onthouden set mee, een ongeldige/onleesbare cache wordt weggegooid.
- **Elite-code-review (2026-09-24), opgelost:** het paneel bouwt een wijziging voort op de laatst
  *verstuurde* set, zodat twee snelle wijzigingen elkaar niet terugdraaien; `setTvDisplay` geeft
  `Promise<boolean>` en een geweigerde slider springt terug naar de bevestigde waarde; het paneel
  toont alleen fouten van een eigen wijziging; de dobbelsteenrand blijft minimaal 1px (besluit
  gebruiker); een onbekende taalwaarde start de detectie niet opnieuw; test voor een opgeslagen
  instelling/event zonder `DiceScale`. De schaalcontext staat nu in `hooks/TvDisplayScaleContext.ts`
  (naast `GameHubProvider`), de test-`Storage` in `test/memoryStorage.ts`.
- Nieuwe namespace `locales/tvDisplay.ts`; `errors.ts` kent `tvDisplay.invalidValue`.

**Bereikbaarheid (besluit gebruiker 2026-09-24).** De header bestaat alleen tijdens
Claiming/InitialPlacement/InProgress. Daarbuiten krijgt de host dezelfde toegang via
`TvDisplayAccess` (knop "TV-weergave" + paneel): in de lobby (`JoinHostWaitStep`), tijdens de
**volgorde-worp** (`OrderRollWaitStep`, `hostActions`-slot) en als **uitgeschakelde host**
(`PlayerEliminatedScreen`, `hostActions`-slot). Het eindscherm hoeft niet (besluit gebruiker).

### 4. Nieuwsbanner met de laatste 10 acties

**Nu.** Er is geen actielog; de TV krijgt alleen state en een paar losse broadcasts.

**Beslissingen.**
- Loopt **vanaf het claimen** (geen lobby, geen volgorde-worp).
- Opeenvolgende plaatsingen van dezelfde speler worden **één regel**
  ("Tim plaatst 3 legers op Brazilië").
- De **laatste actie is duidelijk herkenbaar** (bijv. label "Laatste" of accentkleur).

**Aanpak.**
- [x] Backend: `GameProjection` houdt `RecentActions` bij (max. 10), gestructureerd
      (type, speler, gebied(en), aantallen) zodat de tekst via i18n loopt. Bronnen:
      `TerritoryClaimed`, `InitialArmyPlaced`, `ArmiesReinforced`, `CardsTraded`,
      `CombatResolved`/`TerritoryConquered`, `Fortified`, `PlayerEliminated`, `EventCardDrawn`.
      *Bijgesteld, zie hieronder.*
- [x] Samenvoegen van opeenvolgende plaatsingen door dezelfde speler.
- [x] DTO + TypeScript-types.
- [x] Frontend: `ActionTicker` onderaan `TvShell`, scrolt rechts → links, nieuwste vooraan en gemarkeerd.
- [x] Animatie in `motion.ts`, variant voor `prefers-reduced-motion`; `DESIGN.md` bijwerken.
- [x] Tests op projectie en ticker.

**Beslissingen (2026-09-25, inclusief de elite-code-review van het bouwplan).**
- **Vorm:** een doorlopende ticker van rechts naar links in de lege 146px-onderrij van de drie
  bordschermen. Het oorspronkelijke design had daar een stilstaande feed-strip.
- **Titel "Verloop"** (en: "Feed"). Het nieuwste item krijgt een `LAATSTE`-badge.
- **Plaatsen:** opeenvolgende plaatsingen van dezelfde speler op hetzelfde gebied worden één
  regel met het totaal na afloop ("Tim plaatst 3 legers op Brazilië. Totaal nu 8."). Ook
  verplaatsen en de verovering tonen dat totaal.
- **Aanvallen:** één regel per belegering, met de verliezen opgeteld. Valt het gebied, dan
  wordt diezelfde regel de verovering.
- **Random opstelling:** één neutrale regel, "De gebieden zijn willekeurig verdeeld".
- **Extra:**
  - "Tim krijgt 7 legers om te plaatsen" bij elke beurtstart. Die regel is ook de beurtgrens
    waarover niet wordt samengevoegd.
  - De onthulling van het laatste-kans-venster, alleen bij "Volle ronde met onthulling" (FO §6.2).
- **Bewust niet:**
  - `EventCardDrawn`: de gebeurtenisronde bestaat nog niet (wire-contract).
  - Getrokken kaarten, rolvaardigheden, missies, `PendingWinNarrowed` en `GameWon`.

**Uitvoering (2026-09-25).**
- **Rules:** `RecentAction` en `RecentActionLog` (puur) doen het samenvoegen, het afkappen op 10
  en het oplopende `Sequence`. `Update` zoekt een eerdere regel op; dat is nodig voor de
  meeverplaatsing na een uitschakelende verovering. `GameState.RecentActions` is optioneel, dus
  oude documenten laden met een leeg verloop, en de `GameStateJsonConverter` leest en schrijft
  het veld.
- **Persistence:** alle koppelingen per event staan in `GameProjection.RecentActions.cs`.
- **Api:**
  - `GameStateDto.RecentActions` bevat `RecentActionDto` en `RecentActionKindDto`.
  - De mapper laat de laatste-kans-regels alleen door bij `FullRoundRevealed`, met dezelfde
    voorwaarde als `PendingWinnerPlayerId`.
- **Frontend:**
  - `ActionTicker` staat in rij 3 van `TvClaimingScreen`, `TvInitialPlacementScreen` en
    `TvMainBoardScreen`.
  - Nieuwe keyframe `atlasTicker`, plus `tvAnimations.ticker` en `tickerSpeedPxPerS` (85px/s, bijgesteld van 70 na TV-check gebruiker) in
    `motion.ts`.
  - `atlasFrameIn` stond wel in `motion.ts` maar niet in `index.css`, en is daar toegevoegd.
  - Nieuwe locale `actionTicker.ts`.
- **Design:** `DESIGN.md` heeft een nieuwe sectie "Action Ticker" en de sidecar is
  gesynchroniseerd. De afwijkingsrijen in frontend/CLAUDE.md zijn bijgewerkt.
- **Nog open, op een echte TV:**
  - de leessnelheid (85px/s);
  - de hoogte van de onderrij bij tekstschaal 100. De rij is vast 146px en de ticker wordt
    afgesneden als hij er niet in past.

### 3. Spelinfo op de telefoon

**Nu.** De knop "Spelinfo" staat al in de telefoonheader maar heeft geen `onClick`
([PhonePlayerHeader.tsx:113](../frontend/src/components/PhonePlayerHeader.tsx#L113)).

**Beslissing.** Alleen op de telefoon.

**Aanpak.** `GameInfoPanel`, opgebouwd zoals `CardsPanel`/`MissionPanel`, met tabbladen:
- [x] **Stand:** per speler gebieden, legers, aantal kaarten, continenten in bezit, uitgeschakeld.
      Alleen openbare informatie (geen missies).
- [x] **Spelregels:** beknopte uitleg volgens het FO, afgestemd op de lobby-instellingen van dit spel
      (winconditie, timers, startopstelling, dobbelregel uit punt 7).
- [x] **Rollen** (alleen als rollen aan staan): eigen rol uitgelicht, alle rollen met effect in gewone
      taal, herkomstland en wie de rol heeft.
- [x] **Gebeurteniskaart** (alleen als gebeurtenissen aan staan): actieve kaart, wat die doet en hoe
      lang nog, plus de lijst met mogelijke kaarten. *Bijgesteld, zie hieronder: nu een sectie
      onder Regels met alleen de mogelijke kaarten.*
- [x] Controleren of rol- en gebeurteniscatalogus met effectdetails al in `GameStateDto` zitten;
      zo niet, DTO uitbreiden.
- [x] Tests.

**Beslissingen (2026-09-24, na elite-code-review van het plan).**
- Continenten in bezit **met bonus**.
- De header komt ook op het **uitgeschakeld-scherm** (spelinfo alleen via de header).
- Regelconstanten **in woorden én met een voorbeeld**.
- **Gebeurtenissen horen bij de regels:** een sectie onder Regels, geen eigen tabblad. Live
  gebeurtenisdata (actief / laatst getrokken) komt pas met de gebeurtenisronde.
- **Alle instellingen sturen wat er getoond wordt:** wat uit staat, wordt niet genoemd.
- **Standaardwaarden naar het FO:** rollen en gebeurtenisronde staan standaard **uit** in
  `CreateGameForm` (stonden sinds de eerste versie ten onrechte aan).

**Uitvoering (2026-09-24).**
- **Backend:** `GameStateDto` kreeg `Continents` (`ContinentDto`: id, bonus, eigenaar via
  `OwnsEntireContinent`), `Events` (`EventSummaryDto`: id, duur), `NextCardTradeValue` en
  `StartingArmies`. De voorbeelden in de regels komen zo van de server in plaats van uit tekst.
  `StartingArmiesResolver.TryResolve` geeft `null` voor een spelersaantal buiten het preset, want
  voor weergave is dat geen fout.
- **Frontend:**
  - `GameInfoPanel` met drie tabbladen (`SegmentedControl`), opgebouwd uit
    `GameInfoStandings`, `GameInfoRules` en `GameInfoRoles`.
  - Het gedeelde blok `ui/PanelSection` komt uit `TvDisplayPanel`.
  - `formatMinutes` is gedeeld met het lobbyoverzicht.
  - Nieuwe namespace `locales/gameInfo.ts`.
  - De header zit nu op een vaste plek boven zowel het uitgeschakeld-scherm als het faseschem. Bij
    uitschakeling blijft hij dezelfde instantie, en de status is dan "Uitgeschakeld". Het
    `hostActions`-slot op het uitgeschakeld-scherm is vervallen, want de TV-weergave zit nu in de
    header.
- **Afwijking van het bouwplan:** de `createGame`-beschrijvingen zijn níet hergebruikt voor de
  regels. Ze zijn geschreven als toelichting bij een keuze ("Zoals hiernaast…"), en de klassieke
  dobbelregel noemt de verdedigingsrollen ook als rollen uit staan. Dat botst met de
  instellingsafhankelijkheid, dus spelinfo heeft eigen regelzinnen; alleen de titels zijn gedeeld.
- `DESIGN.md` bijgewerkt: Game Info Panel, de header op het uitgeschakeld-scherm, en de gewijzigde
  toegang tot de TV-weergave.

**Bevinding, buiten scope:** de gebeurtenisronde (FO §9.2) bestaat niet in de backend. De sectie
Gebeurtenissen legt hem uit zoals het FO hem beschrijft, maar in een echt spel wordt nog geen kaart
getrokken.
