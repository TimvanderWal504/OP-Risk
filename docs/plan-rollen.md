<!-- Werkplan, geen changelog: git-commits blijven de enige wijzigingslog (CLAUDE.md). -->
<!-- Oorsprong: onderzoekssessie 2026-09-21; beslissingen door de gebruiker dezelfde dag; herzien na elite-code-review (zelfde dag). Status: VASTGESTELD. -->

# Plan: rollen en hun acties werkbaar maken

## 1. Context — wat er al staat

Het rollensysteem (FO §8, §9.1, §10, §13) is grotendeels gebouwd. Wat er is:

| Onderdeel | Status | Waar |
| --- | --- | --- |
| `roles.json` (15 rollen, 4 effect-types) inlezen + valideren (herkomstland bestaat, geen dubbele, pool ≥ spelers) | ✅ | [MapDefinitionParser.cs:753-843](../src/RiskGame.Rules/Map/MapDefinitionParser.cs#L753-L843), `LobbyGuards.RolePoolIsLargeEnough` |
| Lobby-instellingen `Rollen aan/uit` + `Roltoewijzing Random/Kiezen` | ✅ | `GameSettings`, `CreateGameForm.tsx` |
| Toewijzing Random bij spelstart / Kiezen in de join-flow (`SelectRole`, bezette rollen geblokkeerd) | ✅ | [LobbyCommandHandler.cs:147-265](../src/RiskGame.Api/Commands/LobbyCommandHandler.cs#L147-L265), `JoinRoleStep.tsx`, `LobbyPlayerList.tsx` |
| Startrestrictie herkomstland (Random-verdeling én Claimen) | ✅ | `TerritoryAssignmentCalculator`, `SetupGuards.TerritoryIsNotOwnRoleOrigin` |
| "Boost alleen actief zolang herkomstland in bezit" — één centrale check | ✅ | [RoleEffects.cs](../src/RiskGame.Rules/Roles/RoleEffects.cs) |
| Effect `ExtraReinforcement` in Versterken + "Roleffect"-rij in het telefoon-Opbouw-paneel | ✅ | `ReinforcementCalculator`, `ReinforcementBreakdownDto.RoleBonus` |
| Effect `CardTradeBonus` bij kaarteninleg | ✅ (server) | `CardTradeCalculator` — de telefoon toont de bonus niet apart, zie §2.5 |
| Effect `FortifyUpgrade { throughEnemy }` (pad door 1 vijandelijk gebied) | ✅ | [FortifyGuards.cs:131](../src/RiskGame.Rules/Fortify/FortifyGuards.cs#L131) + `ReachableFortifyGroups` naar de client |
| Dobbelsteen-primitief voor herwerpen | ✅ (alleen engine) | `CombatResolver.RollDice/RerollDie/Compare` + tests |
| Rol zichtbaar op TV in de **lobby** | ✅ | `LobbyPlayerList.tsx` |

## 2. Gaten — wat ontbreekt om "rollen + acties" af te maken

### 2.1 `Reroll` — geen commando, geen state, geen scherm (grootste gat)
- Geen hub-methode/commandhandler: `CombatResolver.RerollDie` wordt nergens aangeroepen.
- Geen registratie "herwerp gebruikt" in de state.
- `PendingCombat` bewaart de aanvalsworp niet; `ChooseDefenseDice` leest de laatste `DiceRolled`
  van de aanvaller terug uit de event-stream ([AttackCommandHandler.cs:112-117](../src/RiskGame.Api/Commands/AttackCommandHandler.cs#L112-L117)).
  `PendingCombatDto` ([GameStateDto.cs:179](../src/RiskGame.Api/Dtos/GameStateDto.cs#L179)) draagt
  alleen `FromTerritoryId/ToTerritoryId/AttackDice` — de telefoon kent de worp na een reconnect niet.
- Geen sub-toestand "aanvaller moet nog beslissen over herwerp": de verdediger kan nu direct kiezen
  zodra `AttackDeclared` is verwerkt. Het FO (§5.3 stap 3, §8.1) zegt dat de herwerp **vóór** de
  verdedigingsworp plaatsvindt en dat de herwerp-prompt geen timer heeft.
- `CombatResolver.RerollDie` sorteert de worp opnieuw aflopend ([CombatResolver.cs:78](../src/RiskGame.Rules/Combat/CombatResolver.cs#L78)):
  een index in de oude worp zegt niets over de positie van de nieuwe waarde.
- Frontend: reroll-blok op de telefoon (`AttackFlowStep`) en "herworpen"-weergave in `TvCombatOverlay`
  ontbreken — al twee keer als afwijking vastgelegd in `frontend/CLAUDE.md`, telkens "buiten scope
  omdat er geen backend-commando is".
- `DESIGN.md`/`.impeccable/design.json` bevatten **geen** component voor het reroll-blok of de TV-weergave.

### 2.2 `FortifyUpgrade { moves: 2 }` — niet geïmplementeerd
- `TurnState.HasFortified` is een bool; `FortifyGuards.CanFortify` weigert elke tweede verplaatsing
  ([FortifyGuards.cs:35](../src/RiskGame.Rules/Fortify/FortifyGuards.cs#L35)). De rollen
  `smokkelaar` en `inca` (`moves: 2`) doen dus feitelijk niets.
- Wire-contract: `TurnStateDto.HasFortified` (bool) is te arm voor "1 van 2 gebruikt".
- Telefoon: `FortifyFlowStep` gaat na één verplaatsing naar een "klaar → beurt beëindigen"-staat;
  een "nog 1 verplaatsing over"-staat bestaat niet (geen design, geen copy).

### 2.3 Rollen permanent op de TV tijdens het spel + boost-status (FO §8, §8.1)
- Het TV-spelerspaneel in `TvMainBoardScreen.tsx` toont naam, gebieden, kaarten en legers — **geen rol**.
  Hetzelfde geldt voor `TvClaimingScreen`/`TvInitialPlacementScreen` (relevant bij Kiezen: de rol
  "stuurt de gebiedskeuze tijdens Claimen").
- "De TV toont per rol of de boost actief is" — niet gebouwd; `PlayerDto` heeft geen
  `isRoleActive`-veld en de client mag die regel (`RoleEffects.Active`) niet zelf nabouwen
  (frontend/CLAUDE.md).
- Geen design voor: rol-badge in de spelersrij, actief/inactief-indicator.

### 2.4 Rol op de eigen telefoon tijdens het spel
- `PhonePlayerHeader`/`TurnStatusHeader` tonen de rol niet; de speler ziet zijn eigen rol alleen in
  de lobby-wachtstap (`JoinWaitStep`). Tijdens het spel is er geen plek waar staat "jouw boost is
  actief/inactief".

### 2.5 Kleine zichtbaarheidsgaten
- `CardsPanel` toont geen inlegwaarde en dus ook geen `+2`-rolbonus bij `Diplomaat`/`Pharaoh`; de
  bonus komt wel in `ReinforcementBreakdown.CardTradeBonus` terecht (opgeteld in `SetValue`).
- `TvCombatOverlay` weet niet dat een worp herworpen is (`DiceRolledMessage.kind` kent alleen
  `attack`/`defense`).

## 3. Genomen beslissingen (door de gebruiker, 2026-09-21)

### A. Spelregels

| # | Onderwerp | Besluit |
| --- | --- | --- |
| A1 | Herwerp-beslissing | **Expliciete stap.** Een aanvaller met actieve `Reroll` kiest na zijn worp eerst "Herwerp X" óf "Doorgaan"; pas daarna mag de verdediger kiezen. Nieuw commando `KeepAttackDice` → TO §4.1 bijwerken (taak 0). |
| A2 | Geen herwerp beschikbaar (rol inactief, of al gebruikt) | Geen prompt; de verdediger mag direct, zoals nu. |
| A3 | Aantal herwerpen | **Altijd precies 1**, niet configureerbaar. Het `Reroll`-effect wordt parameterloos — `"effect": { "type": "Reroll" }` in `roles.json`, `RerollEffect` zonder `PerTurn`, FO §8.1-tabel kolom "Parameters" wordt "—". Een herworpen dobbelsteen kan dus nooit nogmaals herworpen worden. Dit raakt de bevroren `data/roles.json`; dit besluit geldt als de expliciete opdracht daarvoor. |
| A4 | Aanvaller met open herwerp-prompt valt weg | Geen aparte behandeling: zelfde als elke andere aanvaller die tijdens een gevecht wegvalt (timer staat stil, spel wacht). `SetAutoPass` is een andere taak (§4.4). |
| A5 | Tweede verplaatsing (`moves: 2`) | Geen extra restrictie op van/naar; één Verplaatsen-timer voor de hele fase. |
| A6 | `CardTradeBonus` | Rolbonus komt **bovenop** de kaarten-bezitsbonus (+2 per eigen gebied op een ingelegde kaart). Zo werkt `CardTradeCalculator` al: rolbonus in de setwaarde, bezitsbonus apart op de gebieden — geen wijziging. |
| A7 | Eenheid van "per beurt" bij herwerpen | **Per doelgebied per beurt.** Eén herwerp per doelgebied binnen de beurt, ongeacht hoeveel worpen er tegen dat gebied gedaan worden en ongeacht of de aanvaller tussendoor een ander gebied aanvalt en terugkomt (geen reset bij wisselen van doelwit). Een ander doelgebied geeft een eigen herwerp. Nieuwe beurt = schone lei. FO §5.3 stap 3 en §8.1 zeggen nu "per beurt" → aanpassen in taak 0. |
| A8 | Verbruikt "Doorgaan" de herwerp? | **Nee.** De herwerp voor een doelgebied blijft beschikbaar totdat de aanvaller daadwerkelijk op "Herwerp" drukt. Wie bij een worp "Doorgaan" kiest, krijgt bij een volgende worp tegen hetzelfde gebied de prompt opnieuw. Vastleggen in FO §8.1 (taak 0). |

### B. Design

| # | Onderdeel | Besluit |
| --- | --- | --- |
| B1 | Reroll-blok telefoon | Akkoord: uitwerken via `/impeccable shape`, vastleggen in `DESIGN.md`. |
| B2 | TV-weergave herwerp | De herworpen dobbelsteen gebruikt **dezelfde animatie** als de bestaande dobbelstenen (geen nieuwe motion). De gekozen dobbelsteen wordt **gehighlight op telefoon én TV**. De TV highlight op het moment dat de herwerp-opdracht binnenkomt en animeert daarna de nieuwe waarde — geen aparte "selectie"-push vóór het commando, zodat de TV geen client-only tussenstaat hoeft te tonen. Lukt de highlight niet, dan is de terugval "geen highlight" — de keuze van de dobbelsteen blijft altijd bij de speler (FO §8.1: "zelf kiezen"). |
| B3 | Rol op TV | Naam/badge in de spelersrij met actief/inactief-indicator; vorm via `/impeccable`. Geen icoon op het herkomstland (niet gekozen). |
| B4 | Rol op eigen telefoon | Wel tonen, in `PhonePlayerHeader` ("Generaal · actief/inactief" als vertrekpunt); `/impeccable` bepaalt de vorm. |
| B5 | Fortify "nog 1 over"-staat | Akkoord: variant van de bestaande `done`-staat met "Nog een verplaatsing" (primair) naast "Beurt beëindigen". |
| B6 | Verdediger tijdens de herwerp-beslissing | `DefendStep` blijft zichtbaar; de CTA is uitgeschakeld met tekst "Aanvaller overweegt een herwerp…" totdat de aanvaller beslist, daarna de bestaande "Gooi"-knop. Geen apart scherm. |

### C. Techniek

| # | Keuze | Besluit |
| --- | --- | --- |
| C1 | Aanvalsworp in state | `PendingCombat` krijgt `AttackerRolls` en `AwaitingRerollDecision` (bool). `TurnState` krijgt `RerolledTargetTerritoryIds` (set van gebieds-id's, A7/A8): gevuld door `AttackDieRerolled` — **niet** door `AttackDiceKept` —, leeg bij elke nieuwe `TurnState` (Aanvallen is één fase per beurt, dus dat ís per beurt; zelfde mechanisme als `HasFortified`). `ChooseDefenseDiceAsync` leest de worp uit `PendingCombat` i.p.v. de event-stream. |
| C2 | Wie bepaalt `AwaitingRerollDecision` | **De commandhandler**, via een guard (`RoleEffects.Active<RerollEffect>` én doelgebied niet in `RerolledTargetTerritoryIds`); `AttackDeclared` draagt de uitkomst als veld. Vouwregels blijven domme feiten-toepassers, zoals overal in `GameProjection` — geen spelregel-logica in de projectie. |
| C3 | Verplaatsingen | `TurnState.HasFortified` → `FortifiesUsed` (int); `FortifyGuards` vergelijkt met `Moves` van een actieve `FortifyUpgrade` (default 1). DTO: `hasFortified` → `fortifiesRemaining`. |
| C4 | Boost-status | `PlayerDto.IsRoleActive` (openbaar), gevuld in de mapper; toegevoegd in de taak die B3 bouwt. |
| C5 | Reroll op de draad | `PendingCombatDto` krijgt `attackerRolls: number[]` en `awaitingRerollDecision: bool` (taak 4 — telefoon-fase én reconnect-herstel hangen eraan). `DiceRolledMessage` voor `kind = "reroll"` draagt `previousRolls`, `rerolledDieIndex` (index in `previousRolls`), `newValue` en `rolls` (de nieuwe, gesorteerde worp) — een kale index is na de hersortering van `RerollDie` betekenisloos. `CombatResolver.RerollDie` levert daarvoor naast de gesorteerde lijst ook de positie van de nieuwe waarde terug. |
| C6 | `DiceRolled` blijft audit/TV-narratie | Na C1 staat de aanvalsworp in twee events: `AttackDeclared` (leidend, gevouwen) en `DiceRolled` (audit/TV, bewust zonder vouwregel). Doc-comment op `DiceRolled` en `PendingCombat` meebewegen zodat die rolverdeling expliciet is. |
| C7 | Event-versionering | Akkoord: `AttackDeclared` wijzigt → `MapEventType<AttackDeclared>("attack_declared_v2")` in `GameStoreFactory` (bestaand patroon) + pre-release DB-wipe, geen upcast (TO §5). |
| C8 | Gelijktijdige `RerollAttackDie` + `KeepAttackDice` | Handlers gebruiken `LightweightSession` zonder expected-version (bestaand patroon); beide kunnen tegen dezelfde snapshot slagen. Vouwregel: `AttackDiceKept` ná `AttackDieRerolled` (of andersom) is een no-op — `AwaitingRerollDecision` gaat nooit terug naar `true`. Expliciete testcase in taak 3. |
| C9 | i18n | Nieuwe copy in bestaande locale-bestanden (nl/en); nieuw bestand alleen bij een nieuw component. |

## 4. Bevindingen — afgehandeld als volgt

1. **`roles.json` vs. FO §8.1 ("verloren dobbelsteen")** — **FO is leidend.** In taak 0: de vijf
   Reroll-beschrijvingen in `data/maps/standaard-43/roles.json`, `frontend/src/locales/roles.ts`
   (nl/en) en het doc-comment op `RerollEffect` herformuleren naar "herwerp 1 eigen dobbelsteen
   per gebied per beurt, vóór de verdediger gooit" (combineert met A3/A7/A8). Expliciete opdracht
   voor de bevroren data.
2. **Verouderde rijen in `frontend/CLAUDE.md`** — uitzonderingstabel bijwerken in taak 6
   (spelerspaneel bestaat; reroll-rijen vervallen zodra taak 5/6 af zijn).
3. **TO §3.1/§4.1/§5** — bijwerken in taak 0.
4. **`SetAutoPass`** — niet in dit plan; aparte taak.
5. **Hub-autorisatie** (uit de review): geen enkele hub-methode verifieert dat de verbinding
   `playerId` bezit — `RejoinGame` koppelt de connectie via het sessietoken aan de spelersgroep, maar
   `DeclareAttack`, `ChooseDefenseDice` e.d. vertrouwen de meegestuurde `playerId` blind. Bestaand
   gat; `RerollAttackDie`/`KeepAttackDice` erven het. Buiten scope (§7), aparte taak.

## 5. Aanpak — taken (één per sessie, conform CLAUDE.md)

Volgorde: eerst docs en design, zodat elke bouwtaak zowel een spec (FO/TO) als een visuele spec
(`DESIGN.md`) heeft; wire-contract verandert pas in de taak die het scherm of de client-logica bouwt.

### Taak 0 — Docs + data: FO-aanvullingen, TO-bijwerking, parameterloos `Reroll` (twee commits)
**Commit 1, `docs:`**
- FO §5.3 stap 3 en §8.1: herwerp is een expliciete stap (A1), precies 1 per doelgebied per beurt
  (A3/A7), "Doorgaan" verbruikt hem niet (A8), `Reroll` zonder parameters; §5.2:
  `FortifyUpgrade/moves` geeft meerdere verplaatsingen binnen dezelfde fase-timer (A5).
- TO §3.1 (`PendingCombat.AttackerRolls/AwaitingRerollDecision`, `TurnState.RerolledTargetTerritoryIds`,
  `TurnState.FortifiesUsed`), §4.1 (`RerollAttackDie`, `KeepAttackDice`; `ChooseDefenseDice` wacht op
  de beslissing), §5 (`attack_declared_v2`, `AttackDieRerolled`, `AttackDiceKept`, DB-wipe).

**Commit 2, `refactor(roles):`**
- `roles.json` + `locales/roles.ts` + `RerollEffect`: parameterloos effect en nieuwe beschrijving
  (bevinding 1). `MapDefinitionParser` en `ValidatieTests` meebewegen zodat build/test groen blijven.

### Taak 1 — Design-brief: reroll-blok, TV-highlight, rol-badge TV + telefoon, fortify-"nog 1 over" (`/impeccable shape` → `DESIGN.md`)
Op basis van B1–B6. Resultaat: componentbeschrijvingen + copy in `DESIGN.md`/sidecar, door jou
goedgekeurd. Geen backend-afhankelijkheid, daarom vóór alle bouwtaken.

### Taak 2 — `FortifyUpgrade { moves }` (Rules + Persistence + Api + telefoon)
`HasFortified` → `FortifiesUsed`; `FortifyGuards.CanFortify` respecteert `Moves`; vouwregel
`Fortified`; DTO `fortifiesRemaining`; `FortifyFlowStep` krijgt de "nog 1 over"-staat (B5, vorm
uit taak 1). Tests: `FortifiesUsed == 1` met `Moves == 2` → toegestaan, `== 2` → geweigerd;
zonder actieve rol (geen rol, rol inactief doordat het herkomstland in een eerdere beurt verloren
ging) → tweede verplaatsing geweigerd; `EndTurn` toegestaan met 1 van 2 gebruikt.

### Taak 3 — Backend: reroll-state (Rules + Persistence)
`PendingCombat.AttackerRolls` + `AwaitingRerollDecision`, `TurnState.RerolledTargetTerritoryIds`,
`AttackDeclared` v2 met worp + vlag (C2/C7), nieuwe events `AttackDieRerolled` en `AttackDiceKept`,
vouwregels, `AttackGuards.CanRerollAttackDie` / `CanKeepAttackDice`, `CanChooseDefenseDice` weigert
zolang de beslissing open staat, `RerollDie` levert de positie van de nieuwe waarde terug (C5),
doc-comments `DiceRolled`/`PendingCombat` (C6). Tests (Rules + `Persistence.Tests` round-trip):
tweede reroll op hetzelfde doelgebied geweigerd — ook na een tussentijdse aanval elders —, "Doorgaan"
verbruikt niets (A8), ander doelgebied geeft een eigen reroll, volgende beurt schone lei
(`TurnState`-herbouw), dubbele beslissing is no-op (C8). DB-wipe.

### Taak 4 — Api: `RerollAttackDie` + `KeepAttackDice` hub-methoden + wire-contract
Commandhandler, `PendingCombatDto.attackerRolls/awaitingRerollDecision` (C5) + mapper-test,
`DiceRolledMessage` `kind = "reroll"` met `previousRolls/rerolledDieIndex/newValue/rolls`,
`ChooseDefenseDiceAsync` leest de worp uit `PendingCombat`. Hub-tests: reroll zonder actieve rol
geweigerd, verdediger geblokkeerd tot beslissing, TV-push met de juiste velden, DTO gevuld bij
`WatchGame`/`RejoinGame` (reconnect-herstel).

### Taak 5 — Telefoon: reroll-stap in `AttackFlowStep` + verdediger-wachtstaat (B6)
Nieuwe fase `'reroll'` tussen `'dice'` en `'rolled'`, afgeleid uit `pendingCombat.awaitingRerollDecision`
(ook na reconnect): dobbelsteen selecteren → highlight → "Herwerp"/"Doorgaan"; na herwerp de nieuwe
waarde gehighlight op basis van de `reroll`-push. `DefendStep` met uitgeschakelde CTA "Aanvaller
overweegt een herwerp…". Hub-calls in `useGameState`, i18n, tests, design-conformiteitscheck +
afwijkingenlijst.

### Taak 6 — TV: rol-badge + boost-status in het spelerspaneel, herworpen dobbelsteen in de combat-overlay
`PlayerDto.IsRoleActive` (C4) + mapper-test; spelersrij in `TvMainBoardScreen`/`TvClaimingScreen`/
`TvInitialPlacementScreen`; `TvCombatOverlay`/`useCombatBroadcast` verwerken `kind = "reroll"`:
highlight van `rerolledDieIndex` in `previousRolls`, daarna de bestaande dobbelsteen-animatie naar
`rolls` met `newValue` gehighlight (B2). Verouderde rijen in de `frontend/CLAUDE.md`-uitzonderingstabel
opschonen (bevinding 2).

### Taak 7 — Telefoon: eigen rol + boost-status in `PhonePlayerHeader` (B4)
Vorm uit taak 1. Optioneel in dezelfde sessie: `+2`-rolbonus zichtbaar in `CardsPanel` (§2.5).

## 6. Wat er per taak van jou nodig is

1. Taak 1: goedkeuring van de `/impeccable shape`-uitkomst voordat die in `DESIGN.md` landt.
2. Per taak: `dotnet build RiskGame.sln`, `dotnet test RiskGame.sln`, en bij frontend-taken
   `pnpm run build` + `pnpm test` — jij draait ze, ik lever de commando's (CLAUDE.md).
3. Bij taak 3: de DB-wipe uitvoeren (C7).
4. Na taak 6: één e2e-scenario volgens `docs/e2e-teststrategie.md` met drie clients (aanvaller
   met actieve `Reroll`, verdediger, TV): worp → herwerp → verdediging → resultaat, plus reconnect
   van de aanvaller tijdens de herwerp-prompt.

## 7. Bewust buiten scope
- Gebeurtenisronde (FO §9.2) — ander feature-toggle, ander plan.
- `SetAutoPass`/apparaatwissel (TO §11 stap 6) — bestaande bevinding, los oppakken.
- Hub-autorisatie van `playerId` per verbinding (bevinding 5) — bestaand gat, aparte taak.
- Nieuwe effect-types of rollen; de enige datawijziging is de `Reroll`-tekst/-parameter uit taak 0 (A3, bevinding 1).
- Kaartvarianten zonder Nieuw-Zeeland (`maori`-uitsluiting werkt al via de parser).
