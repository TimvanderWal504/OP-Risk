<!-- Werkplan, geen changelog: git-commits blijven de enige wijzigingslog (CLAUDE.md). -->
<!-- Oorsprong: TV-testronde + onderzoekssessie 2026-09-23; beslissingen door de gebruiker dezelfde dag. Status: VASTGESTELD. -->

# Plan: bevindingen TV-testronde

Acht bevindingen uit een testspel op een echte TV. Eén punt per sessie, in de volgorde
van §1. Vink een punt pas af als code, tests en (waar genoemd) FO/`DESIGN.md` bijgewerkt zijn.

## 1. Volgorde en afvinklijst

- [x] **5** — Missie "18 gebieden met ≥ 2 legers" alleen bij 4+ spelers
- [ ] **6** — Streep in de "V" van "VS" op het TV-gevechtsoverlay
- [ ] **1** — Legerstand van de verdediger tonen op de telefoon
- [ ] **8** — Engelse teksten tussen de Nederlandse
- [ ] **7** — Lobby-instelling dobbelregel + nieuwe verdedigingsrol (Brazilië)
- [ ] **2** — TV-weergave-instellingen (tekstschaal, glas) vanaf de host-telefoon
- [ ] **4** — Nieuwsbanner met de laatste 10 acties op de TV
- [ ] **3** — Spelinfo op de telefoon

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

### 6. Streep in de "V" van "VS"

**Bevinding (screenshot 2026-09-23).** De blauwe lijn zit ín de letter V. De tekst staat als
kleine letters `vs` in [attackTv.ts:13](../frontend/src/locales/attackTv.ts#L13); het merk-lettertype
toont die als hoofdletters maar gebruikt de tekening van de kleine `v`, met die schuine streep.
"VEROVERD" (zelfde font, zelfde gewicht, wél hoofdletters in de locale) heeft schone V's.
Er zit geen rand of scheidingslijn in de layout van [TvCombatOverlay.tsx](../frontend/src/routes/tv/screens/TvCombatOverlay.tsx).

**Aanpak.**
- [ ] Locale `vs` → `'VS'` (nl en en).
- [ ] Controleren op TV of screenshot. Blijft de streep: glyph in `brand-font.ttf` controleren of
      "VS" een lichter gewicht geven.
- [ ] Andere kleine-letterteksten in `font-display` zoeken en ook in hoofdletters zetten.

### 1. Legerstand van de verdediger op de telefoon

**Nu.** [DefendStep.tsx](../frontend/src/components/DefendStep.tsx) krijgt `defenderArmyCount` al
binnen, maar gebruikt het alleen voor de 1-dobbelsteenregel.

**Aanpak.**
- [ ] Regel onder de kleurblokken: "Jouw legers op {gebied}: N", eventueel ook het aantal legers
      van de aanvaller in het brongebied (staat al in de state).
- [ ] Nieuwe keys in `locales/attack.ts` (nl + en).
- [ ] Test in `DefendStep.test.tsx`.

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
- [ ] Taal standaard op `nl` vastzetten; browsertaal niet meer gebruiken (`en` blijft beschikbaar).
- [ ] Inventaris van alle Engelse UI-teksten met voorgestelde vertaling → ter goedkeuring aan de gebruiker.
- [ ] Na akkoord in één keer vervangen.
- [ ] Test in `locales/index.test.ts` die veelvoorkomende Engelse woorden in `nl`-leaves opspoort
      (met uitzonderingslijst voor de grappen).

### 7. Dobbelregel als lobby-instelling + verdedigingsrol

**Let op.** Wijkt af van FO §5.3 (verdediger kiest altijd 1–2) en van de officiële Risk-regels
(verdediger mag 2 gooien vanaf 2 legers, ongeacht de aanvaller). Bewuste huisregel.

**Beslissingen.**
- Nieuwe lobby-instelling: **Huisregel** (aanvaller gooit 1 → verdediger ook 1) of **Klassiek**.
  Standaard: **Huisregel**.
- Nieuwe rol met herkomstland **Brazilië**: één keer per ronde toch met 2 dobbelstenen
  verdedigen tegen 1; weer beschikbaar **aan het begin van de eigen beurt** van de verdediger.
- Bij **Klassiek** valt deze rol uit de pool (niet uitgedeeld, niet kiesbaar).
- Naam en flavourtekst: voorstel door Claude, goedkeuring door de gebruiker.

**Aanpak.**
- [ ] FO §5.3, §8 en §10 bijwerken (eerst, conform CLAUDE.md).
- [ ] `GameSettings` + DTO + `CreateGameForm` + `LobbySettingsSummary`: nieuwe instelling.
- [ ] `AttackGuards.CanChooseDefenseDice`: bij 1 aanvalsdobbelsteen en Huisregel alleen 1 toegestaan
      (nieuwe foutcode), tenzij de boost wordt ingezet.
- [ ] Nieuw effecttype (bijv. `DefenseBoost`) in Rules + parser; `roles.json` uitbreiden.
- [ ] State: "boost gebruikt" per speler, reset bij begin eigen beurt (Rules + event + projectie).
- [ ] Rolpool filteren op de instelling (Random én Kiezen).
- [ ] `DefendStep`: bij gedwongen 1 geen keuze tonen, behalve de boost-knop als die beschikbaar is.
- [ ] TV: boost-inzet zichtbaar in het gevechtsoverlay.
- [ ] Tests: guards, reset, rolpool, hub.

### 2. TV-weergave-instellingen vanaf de host-telefoon

**Nu.** Tekstgroottes zijn `rem`-CSS-variabelen (`--text-*` in `twc-theme.css`); glas loopt via
`--glass-bg` / `--glass-filter` in [GlassPanel.tsx](../frontend/src/components/ui/GlassPanel.tsx).

**Beslissing.** Bediening op de **telefoon van de host**; de server stuurt de waarden naar de TV,
zodat ze blijven staan na herladen van de TV.

**Aanpak.**
- [ ] Backend: hub-methode (alleen host) + opslag in de state + meesturen in `GameStateDto`.
- [ ] `TvShell`: `--tv-text-scale`, `--tv-glass-opacity`, `--tv-glass-blur`; `--text-*` alleen
      binnen de TV-shell overschrijven, telefoon ongemoeid.
- [ ] `GlassPanel` (`context="tv"`): tint en blur vermenigvuldigen met de variabelen.
- [ ] Host-telefoon: menu "TV-weergave" met schuifregelaars en reset.
- [ ] `DESIGN.md` bijwerken via `/impeccable document`.
- [ ] Tests.

### 4. Nieuwsbanner met de laatste 10 acties

**Nu.** Er is geen actielog; de TV krijgt alleen state en een paar losse broadcasts.

**Beslissingen.**
- Loopt **vanaf het claimen** (geen lobby, geen volgorde-worp).
- Opeenvolgende plaatsingen van dezelfde speler worden **één regel**
  ("Tim plaatst 3 legers op Brazilië").
- De **laatste actie is duidelijk herkenbaar** (bijv. label "Laatste" of accentkleur).

**Aanpak.**
- [ ] Backend: `GameProjection` houdt `RecentActions` bij (max. 10), gestructureerd
      (type, speler, gebied(en), aantallen) zodat de tekst via i18n loopt. Bronnen:
      `TerritoryClaimed`, `InitialArmyPlaced`, `ArmiesReinforced`, `CardsTraded`,
      `CombatResolved`/`TerritoryConquered`, `Fortified`, `PlayerEliminated`, `EventCardDrawn`.
- [ ] Samenvoegen van opeenvolgende plaatsingen door dezelfde speler.
- [ ] DTO + TypeScript-types.
- [ ] Frontend: `ActionTicker` onderaan `TvShell`, scrolt rechts → links, nieuwste vooraan en gemarkeerd.
- [ ] Animatie in `motion.ts`, variant voor `prefers-reduced-motion`; `DESIGN.md` bijwerken.
- [ ] Tests op projectie en ticker.

### 3. Spelinfo op de telefoon

**Nu.** De knop "Spelinfo" staat al in de telefoonheader maar heeft geen `onClick`
([PhonePlayerHeader.tsx:113](../frontend/src/components/PhonePlayerHeader.tsx#L113)).

**Beslissing.** Alleen op de telefoon.

**Aanpak.** `GameInfoPanel`, opgebouwd zoals `CardsPanel`/`MissionPanel`, met tabbladen:
- [ ] **Stand:** per speler gebieden, legers, aantal kaarten, continenten in bezit, uitgeschakeld.
      Alleen openbare informatie (geen missies).
- [ ] **Spelregels:** beknopte uitleg volgens het FO, afgestemd op de lobby-instellingen van dit spel
      (winconditie, timers, startopstelling, dobbelregel uit punt 7).
- [ ] **Rollen** (alleen als rollen aan staan): eigen rol uitgelicht, alle rollen met effect in gewone
      taal, herkomstland en wie de rol heeft.
- [ ] **Gebeurteniskaart** (alleen als gebeurtenissen aan staan): actieve kaart, wat die doet en hoe
      lang nog, plus de lijst met mogelijke kaarten.
- [ ] Controleren of rol- en gebeurteniscatalogus met effectdetails al in `GameStateDto` zitten;
      zo niet, DTO uitbreiden.
- [ ] Tests.
