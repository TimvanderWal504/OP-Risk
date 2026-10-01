# Technisch Ontwerp — Digitaal Risk

**Versie:** 1.2 · **Datum:** 21 september 2026 · **Status:** Grotendeels geïmplementeerd (bouwstappen 1–3, zie §11); frontend-kaartlaag (stap 5) nog te bouwen; herwerp-stap en meervoudig Verplaatsen (`docs/plan-rollen.md`) ontworpen, nog te bouwen
**Verwant:** `functioneel-ontwerp-risk.md` (het *wat*); dit document beschrijft het *hoe*.

---

## 1. Architectuuroverzicht

Server-authoritative client-server-model. De server is de enige bron van waarheid: alle spelregels, dobbelworpen, validaties en state-overgangen gebeuren server-side. Clients (TV en telefoons) zijn "domme" weergaves die commando's sturen en state-updates ontvangen.

```
┌──────────────┐   SignalR (WebSocket)   ┌────────────────────────────┐
│  TV (host)   │◀───── state push ───────│  RiskGame.Api               │
│  React SPA   │                         │  Minimal API + SignalR hub  │
└──────────────┘                         │  + TurnTimerBackgroundService│
                                         │                            │
┌──────────────┐   commando's ──────────▶│  → RiskGame.Rules (pure C#)│
│  Telefoon(s) │◀───── state push ───────│  → RiskGame.Persistence    │
│  React SPA   │                         │    (Marten events+proj.)   │
└──────────────┘                         └─────────────┬──────────────┘
                                              ┌────────▼────────┐
                                              │  PostgreSQL      │
                                              │  (Marten docs +  │
                                              │   event streams) │
                                              └──────────────────┘
```

**Implementatiestatus:** deze laag staat — `RiskGame.Rules`, `RiskGame.Persistence` en `RiskGame.Api` (incl. hub, commandohandlers en `TurnTimerBackgroundService`) zijn gebouwd en getest (§11). Wat nog ontbreekt is de kaartlaag in de frontend (§7.2), niet de backend.

**Kernprincipe:** de client toont alleen geldige opties (betere UX), maar de server **hervalideert elke inkomende actie onafhankelijk**. De client wordt nooit vertrouwd — niet voor geldigheid, niet voor dobbelworpen, niet voor volgorde.

---

## 2. Technologiekeuzes

| Laag | Keuze | Motivatie |
|---|---|---|
| Backend-runtime | .NET 8+, C# | Bestaande expertise; sterke concurrency- en typing-garanties voor een regelzware engine |
| API | ASP.NET Core Minimal API | Lichtgewicht; de meeste interactie loopt toch via SignalR, niet REST |
| Realtime | SignalR (WebSockets) | Bidirectionele push naar TV + telefoons; ingebouwde reconnect/groepen |
| Persistentie | Marten (event sourcing + document store) op PostgreSQL | Event sourcing past natuurlijk bij een beurt-gebaseerd spel; volledige replay/herstel "gratis" |
| Rules engine | Pure C#-library, geen framework-afhankelijkheden | Unit-testbaar in isolatie; deterministisch; herbruikbaar los van transport/persistentie |
| Event sourcing | Los project `RiskGame.Persistence` (Marten-events + `GameProjection`, `ProjectionLifecycle.Inline`) | Scheidt event-/projectiecode van zowel de pure rules engine als de API-laag; inline-projectie gekozen (zie §10.1, niet langer open) |
| Frontend | React 19 + TypeScript + Vite + Tailwind | Consistent met de Claude Design-prototypes; snelle dev-loop |
| Kaartweergave | SVG-overlay (`territories.geo.json`) bovenop de statische achtergrond (`map-background-final.png`) | Klikbare, per-eigenaar-kleurbare gebieden los van de artwork-laag |
| Hosting | Azure App Service (Basic B1, Linux) voor API + SignalR, Neon (managed Postgres, directe/unpooled connectie) voor Marten, Vercel voor de frontend | Zie `docs/azure-hosting-deployment.md` |

---

## 3. Domeinmodel (rules engine)

De rules engine is een **pure, deterministische** C#-library: dezelfde input geeft altijd dezelfde output, met één uitzondering — dobbelworpen — die via een geïnjecteerde `IRandomSource` lopen zodat ze in tests vervangbaar zijn door een vaste seed.

### 3.1 Kernentiteiten (conceptueel)

```
GameState
├─ GameId
├─ Phase            (Lobby | OrderRoll | Claiming | InitialPlacement | InProgress | Finished)
├─ Settings         (winconditie, startopstelling, startlegers, timer, feature-toggles)
├─ Players[]        (id, naam, kleur, rol?, missie?, kaarten[], isEliminated, isHost, isAutoPass, pendingEventBonus)
├─ Territories[]    (territoryId → ownerPlayerId, armyCount)
├─ TurnState        (activePlayerId, currentPhase, timer? {resterend, gepauzeerd}, pendingCombat? {from, to, attackDice,
│                    attackerRolls, awaitingRerollDecision}, rerolledTargetTerritoryIds[], fortifiesUsed, ...)
├─ Deck             (trekstapel, aflegstapel, volgende inleg-waarde)
├─ ActiveEffects[]  (lopende oneRound-gebeurteniseffecten; verlopen op de volgende rondegrens)
├─ EventRound       (CurrentEventId? = laatst getrokken kaart tot de volgende trekking,
│                    DrawPile = trekvolgorde zonder teruglegging,
│                    PendingAttrition? = lopende ArmyAttrition-keuzes: amount, wachtende spelers, volgende speler)
└─ TurnOrder[]      (spelersvolgorde, bepaald door de order-roll)
```

Let op: dit is de **geprojecteerde** state (het "nu"). De bron van waarheid is de event-stream (§5); deze state is een projectie daarvan.

### 3.2 Statische speldata (read-only, geladen bij opstart)

Deze bestanden zijn de gevalideerde output uit het ontwerp-traject en worden bij het aanmaken van een spel ingelezen, niet in code gehardcodeerd. Ze staan **per kaartvariant** onder `data/maps/{mapId}/`, zodat de host straks in de lobby tussen varianten kan kiezen zonder dat er code verandert. Uitzondering: `colors.json` is **gedeeld over alle kaartvarianten** (de spelerskleuren-catalogus verschilt niet per kaart) en staat daarom in `data/colors.json`, één niveau boven `data/maps/`. De eerste variant is **`standaard-43`**:

| Bestand | Rol in de engine |
|---|---|
| `territories.json` | 43 gebieden: id, naam, continent, centroid |
| `territories.geo.json` | Polygon-geometrie per gebied (frontend-render + klik-detectie) — niet door de engine geladen |
| `adjacency_validated.json` | 86 grenzen (`from`, `to`, `type: land\|sea`) — de aangrenzingsgraaf |
| `continents.json` | Continentbonussen |
| `colors.json` (gedeeld, `data/colors.json`) | 7 spelerskleuren: `hex` (fill) + `onHex` (contrastkleur voor tekst/symbool erop) + kleurenblind-symbolen |
| `cards.json` | Set-regels, inleg-thema's, `ownedTerritoryBonus`, `deck.symbols` en `deck.jokerCount` — het deck zelf wordt afgeleid uit de gebieden (FO §4.4) |
| `roles.json` / `missions.json` / `events.json` | Rollen, missies en gebeurteniskaarten — datamodel én content ingevuld (FO §13) |

| `map.json` | Weergavenaam van de variant en `defaultStartingArmiesPresetId` — voor de kaartkeuze in de lobby, niet door de rules engine gebruikt |

**Tweede variant: `wereld-49`** (FO §4.5) — dezelfde bestanden, met 49 gebieden. De zes extra gebieden zijn afgesplitst van bestaande; alle 43 ID's van `standaard-43` bestaan ook hier, zodat `roles.json`, `events.json` en `cards.json` letterlijke kopieën zijn. Alleen `missions.json` verschilt (`territory-30` en `territory-24-min2`). `territories.json` en `territories.geo.json` komen uit `files/build_wereld_49.py`, dat zonder Natural Earth-brondata of `shapely` werkt: het leest de al geünieerde geometrie van `standaard-43`, verplaatst eilandpolygonen op ligging, neemt Chili over uit `territories_extended.geo.json` en snijdt West-Afrika en West-China af met één rechte lijn (Sutherland–Hodgman tegen een halfvlak). Middelpunten rekent het met dezelfde vlakke, oppervlakte-gewogen formule als shapely's `centroid`; voor de ongewijzigde gebieden is geverifieerd dat die exact de opgeslagen waarden van `standaard-43` oplevert. `adjacency_validated.json` wordt, net als bij `standaard-43`, met de hand vastgesteld en geautomatiseerd tegen de geometrie gecontroleerd.

**Kaartkeuze (FO §10):** `GET /maps` geeft per variant `mapId`, naam en `defaultStartingArmiesPresetId` uit `map.json`. `CreateGameForm` kiest daaruit in plaats van de vaste `MAP_ID` in `HomePage`; `CreateGameRequest.MapId` bestaat al en verandert niet.

**Validatie per variant:** dezelfde datatests draaien voor elke map onder `data/maps/`: graaf volledig verbonden, landgrenzen consistent met de geometrie, alle `TerritoryLocked`-/`SeaRoutesBlocked`-verwijzingen en rol-herkomstlanden bestaan op die kaart, en het afgeleide deck klopt (51 kaarten, 17/17/17 voor `wereld-49`).

**Missieteksten (FO §6.1):** de speler-DTO draagt naast `missionId` ook de parameters van de eigen missie (`count`, `minArmies`). De frontend vertaalt `TerritoryCount`/`TerritoryCountMinArmies` per missietype met die waarden ingevuld, in plaats van per missie-ID met een vast getal.

De engine bevat **geen** kaart-, kleur- of kaartkennis in code; alles komt uit deze bestanden. Dat is de kern van "data-driven" uit het FO: een nieuwe kaart of extra gebied = andere data, geen codewijziging.

`MapDefinitionParser.Parse(mapId, sources)` levert per aanroep een nieuwe, onafhankelijke `MapDefinition`; er is geen static of gedeelde cache, zodat twee gelijktijdige spellen met verschillende varianten elkaar niet kunnen beïnvloeden. De parser neemt **JSON-tekst** aan, geen paden: het lezen van bestanden gebeurt buiten `RiskGame.Rules`, dat daarmee vrij van I/O blijft.

### 3.3 Aangrenzing & het `SeaRoutesBlocked`-effect

De adjacency-graaf wordt bij opstart uit `adjacency_validated.json` in een `Dictionary<string, List<Border>>` geladen (beide richtingen). Twee bevragingen die de engine nodig heeft:

- **`GetAttackableTargets(from)`** — buren van `from` in bezit van een ándere speler, minus geblokkeerde zeeroutes als `SeaRoutesBlocked` actief is.
- **`GetFortifyPath(from, to)`** — bestaat er een aaneengesloten pad via **eigen** gebieden? (moderne fortify, FO §5.2). BFS over de graaf, beperkt tot gebieden van de actieve speler, met dezelfde zee-blokkade-filter.

**`SeaRoutesBlocked`-afhandeling (FO §9.2):** het effect filtert `type: "sea"`-grenzen weg. Ondersteunt de optionele `routes`-parameter voor gedeeltelijke blokkade. Heeft een speler door de blokkade nul geldige aanvallen of verplaatsingen, dan slaat de engine die fase **niet** over (herzien 2026-09-26, FO §9.2): een fase afsluiten blijft een speleractie (`EndPhase`/`EndTurn`) of een timer-afloop. De guards leveren dan simpelweg geen geldige doelen. Welke gebieden afgesloten en welke grenzen geblokkeerd zijn, bevragen de guards op één plek (`ActiveEffectQueries`). Getest scenario: 6 eilandgebieden (Groenland, IJsland, Groot-Brittannië, Japan, Madagaskar, Nieuw-Guinea) raken volledig geïsoleerd bij volledige blokkade.

**Frontgebieden voor auto-pass (FO §11.2):** de automatische versterking verdeelt over eigen gebieden met minstens één grens (land of zee) naar een gebied van een ander. Dat is de **kale** graaf, zonder `ActiveEffectQueries`: een zeeblokkade duurt één ronde en maakt een eiland niet tot achterland. Elke plaatsing gaat nog langs `ReinforceGuards.CanPlaceArmies` — dezelfde regel als voor een speler zelf — als vangnet, niet als filter: na de verplichte inleg weigert die guard een eigen gebied nooit, dus een weigering is een bug en levert een exception op in plaats van dat legers stil ergens anders heen gaan.

---

## 4. Commando's & validatie

Elke speleractie is een **commando** dat de client naar de server stuurt. De server draait per commando dezelfde pijplijn:

```
Commando binnen (SignalR)
      │
      ▼
1. Authenticatie   → hoort dit token bij deze speler in dit spel? (vandaag alleen bij RejoinGame
                     en SetAutoPass; de overige commando's vertrouwen de meegestuurde playerId —
                     algemene hub-autorisatie is een aparte taak)
2. Autorisatie     → is het deze spelers beurt / mag hij dit nu?
3. Fase-check      → past dit commando bij de huidige fase?
4. Regelvalidatie  → rules engine: is de actie geldig op de huidige state?
      │  (faalt → foutmelding terug naar alleen deze client, geen state-wijziging)
      ▼
5. Event(s) genereren → wat er feitelijk gebeurt (bv. ArmiesPlaced, CombatResolved)
6. Event(s) persisteren (Marten append)
7. State opnieuw projecteren
8. State-delta pushen naar TV + relevante telefoons (SignalR)
```

### 4.1 Commando-catalogus (v1)

Elk commando hieronder dat een bestaand spel wijzigt, laadt dat spel onder een lock per spel (`GameWriteLock`, §5.2): commando's op hetzelfde spel lopen na elkaar.

| Commando | Fase | Kernvalidatie |
|---|---|---|
| `JoinGame` | Lobby | Gamecode geldig, plek vrij, kleur vrij |
| `ChooseColor` | Lobby | Kleur nog niet bezet |
| `RollForOrder` | OrderRoll | Speler heeft nog niet geworpen |
| `ClaimTerritory` | Claiming | Gebied is vrij, het is spelers beurt |
| `PlaceInitialArmy` | InitialPlacement | Speler heeft nog startlegers, gebied is van hem |
| `TradeCards` | Reinforce | Geldige set (`cards.json`-regels), verplicht bij 5+ kaarten |
| `PlaceArmies` | Reinforce | Aantal ≤ beschikbare versterkingen, gebied van speler |
| `DeclareAttack` (= "Gooi") | Attack | Van-gebied ≥ 2 legers, doel is vijandelijke buur, #dobbelstenen ≤ legers−1 (max 3). Opent de herwerp-stap (`PendingCombat.AwaitingRerollDecision`) als de aanvaller een actieve `Reroll`-rol heeft én het doelgebied nog niet in `TurnState.RerolledTargetTerritoryIds` staat (FO §5.3 stap 3) |
| `RerollAttackDie` | Attack | Herwerp-stap staat open; `dieIndex` binnen de eigen worp. Voegt het doelgebied toe aan `RerolledTargetTerritoryIds` (FO §8.1: één per doelgebied per beurt) |
| `KeepAttackDice` (= "Doorgaan") | Attack | Herwerp-stap staat open. Sluit de stap zonder herwerp; verbruikt niets (FO §8.1) |
| `ChooseDefenseDice` | Attack (verdediger) | 1 of 2; bij 1 verdedigend leger gedwongen 1; geweigerd zolang de herwerp-stap open staat |
| `MoveAfterConquest` | Attack | ≥ gebruikte aanvalsdobbelstenen, ≤ (bron−1) |
| `AbandonAttack` (= "Ander gevecht") | Attack | Speler aan de beurt, geen actief `PendingCombat`, er staat een bevroren belegering (`TurnState.PausedAttackTarget`) om af te breken |
| `Fortify` | Fortify | Pad via eigen gebieden bestaat, ≥ 1 leger blijft achter, `TurnState.FortifiesUsed` < toegestane verplaatsingen (1, of `moves` van een actieve `FortifyUpgrade`-rol — FO §5.2) |
| `EndPhase` / `EndTurn` | diverse | Speler is aan de beurt. `EndTurn` handelt op de rondegrens de gebeurtenisronde af (§5.2) en wordt bij een botsende gelijktijdige append tot 3× opnieuw geprobeerd |
| `RemoveArmies` | tussen twee beurten (`PendingAttrition`) | Er loopt een attrition-keuze en de speler staat op de wachtlijst; elk genoemd gebied is van hem, staat een positief aantal af en houdt minstens 1 leger; het totaal is exact `amount` (of het maximum). De laatste keuze start de beurt van `PendingAttrition.NextPlayerId`. Bij een botsende gelijktijdige append tot 3× opnieuw geprobeerd (FO §9.2) |
| `SetAutoPass` (host) | InProgress | De aanroepende connectie hoort bij de meegestuurde speler (`PlayerPresenceRegistry`, hieronder) en die is host; doel ≠ host, niet uitgeschakeld, nog niet op auto-pass; daarna blijft minstens één niet-uitgeschakelde speler zonder auto-pass over. Handelt in dezelfde batch af wat op het doel wacht (verdediging, attrition-keuze, eigen beurt — FO §11.2). Bij een botsende gelijktijdige append tot 3× opnieuw geprobeerd. Er is geen commando om auto-pass op te heffen: dat doet `RejoinGame` (§6.3) |
| `SetTvDisplay` (host) | elke | Aanroeper is host; tekstschaal/glasdekking/glasblur/dobbelsteenschaal 0–100 in stappen van 5, taal NL/EN. Weergave-instelling van de TV, geen spelregel; bij een botsende gelijktijdige append tot 3× opnieuw geprobeerd |
| `VoteReplay` / `HostRestart` (host) | Finished | — |
| `RegisterTv` (TV) | vóór een spel | Geen — geeft de aanroepende connectie een koppelcode (zelfde alfabet/lengte als een spelcode) voor "TV koppelen" (FO §2.2). Opnieuw aanroepen vervangt de vorige code van die connectie |
| `SendGameToTv` (host-telefoon) | elke | Spel bestaat (`common.unknownGame`), daarna pas koppelcode bestaat (`tvPairing.unknownCode`) — zo maakt een typefout in de spelcode de QR niet onbruikbaar. Neemt de code in (eenmalig) en pusht `TvPaired(gameId)` naar alleen die TV-connectie. Bewust **geen** rate limit (anders dan `JoinGame`, §8): het ergste gevolg van een geraden code is een vreemd spel op iemands TV, en codes zijn kortlevend en eenmalig |

**Het volledige verloop is een leesaanroep, geen commando.** `GetActionLog(gameId)` levert elke openbare regel uit `GameState.RecentActions` (nieuwste eerst, laatste-kans-regels alleen bij "Volle ronde met onthulling"), voor het tabblad Spelverloop op de telefoon. De state-update stuurt er maar de laatste 10 mee (`GameStateDtoMapper.TvRecentActionCount`), zodat hij niet meegroeit met de lengte van het spel.

**TV-koppeling is geen commando op het spel.** `RegisterTv`/`SendGameToTv` raken de event store niet: een koppeling is transiënte verbindingsinfo, geen speltoestand. De server houdt ze in-memory bij (`TvPairingRegistry`, per connectie, opgeruimd bij disconnect). Gevolgen: na een server-herstart of reconnect vraagt de TV zelf een nieuwe code aan, en bij meerdere serverinstanties moeten TV en host-telefoon op dezelfde instantie uitkomen — dezelfde beperking als de SignalR-groepen zonder backplane.

**Aanwezigheid is ook transiënte verbindingsinfo (FO §11.1).** `PlayerPresenceRegistry` (singleton, in-memory) houdt per connectie bij welke speler in welk spel erachter zit. Alleen `JoinGame` en `RejoinGame` mét geldig sessietoken registreren; `WatchGame` (TV, en de telefoon vóór het joinen) telt niet mee. `OnDisconnectedAsync` meldt de connectie af; is dat de laatste connectie van die speler, dan noteert de registry "weg sinds". Twee dingen hangen eraan: `SetAutoPass` controleert ermee dat de aanroepende connectie echt bij de meegestuurde speler hoort (de enige hub-methode die dat vandaag doet; algemene hub-autorisatie is een aparte taak), en `HostAbsenceBackgroundService` (elke 5 s, via `TimeProvider`) loopt de registry door en zet een host die in een `InProgress`-spel 2 minuten weg is op auto-pass, met in dezelfde batch `HostTransferred` naar de volgende speler in de beurtvolgorde en dezelfde directe afhandeling als `SetAutoPass` (de host kan net verdediger, attrition-kiezer of zelf aan de beurt zijn). Een uitgeschakelde host krijgt alleen `HostTransferred`. Is er geen geschikte opvolger (niet uitgeschakeld, niet op auto-pass), dan gebeurt er niets. De service laadt een spel pas als die grens bereikt is, niet elke ronde alle spellen. Zelfde beperkingen als de TV-koppeling: na een server-herstart is de registry leeg (de 2 minuten lopen pas na een nieuwe verbinding die weer wegvalt), en bij meerdere instanties klopt hij niet.

### 4.2 Server-side dobbelen

Alle worpen (`DeclareAttack`, `ChooseDefenseDice`, `RollForOrder`, en het `Reroll`-roleffect) gebeuren uitsluitend server-side via `IRandomSource`. De client stuurt alleen de **intentie** (aantal dobbelstenen); de server bepaalt de uitkomst, persisteert die als event, en pusht 'm naar alle clients zodat de TV de worp kan animeren. Zo is de worp niet manipuleerbaar en reproduceerbaar in replays/tests.

---

## 5. Event sourcing (Marten)

### 5.1 Waarom event sourcing hier past

Risk is intrinsiek een reeks discrete, geordende gebeurtenissen. Dat sluit één-op-één aan bij een append-only event-stream per spel:

- **Herstel na crash** (Plan B, betrouwbaarheid): de server rebuildt de exacte state door de stream te replayen — geen aparte "save"-logica nodig.
- **Reconnect** (FO §11.1): een terugkerende client krijgt de huidige projectie; de stream garandeert dat die compleet en consistent is.
- **Debugbaarheid**: elke desync of vermeende regelfout is achteraf exact te reconstrueren.
- **Auditbaarheid van dobbelen**: elke worp staat als onveranderlijk event vast.

### 5.2 Streams & events

E�n event-stream per `GameId`. Events zijn onveranderlijke feiten in verleden tijd:

```
GameCreated, PlayerJoined, ColorChosen, OrderRolled, TurnOrderDetermined,
TerritoryClaimed, InitialArmyPlaced, RoleAssigned, MissionAssigned,
CardsTraded, ArmiesReinforced, AttackDeclared, DiceRolled, AttackDieRerolled, AttackDiceKept, CombatResolved,
TerritoryConquered, ArmiesMovedAfterConquest, Fortified,
CardDrawn, PlayerEliminated, EventDeckShuffled, EventCardDrawn, EffectApplied, EffectExpired,
AttritionStarted, ArmiesRemoved, PhaseChanged, TurnEnded, MissionCompleted, GameWon,
AutoPassEnabled, AutoPassDisabled, HostTransferred
```

**Gebeurtenisronde tussen twee beurten (FO §9.2).** Op de rondegrens appendt `EndTurn` — ná de missie-/laatste-kans-afhandeling en alleen zonder `GameWon` — `EffectExpired` voor de lopende effecten, zo nodig `EventDeckShuffled`, dan `EventCardDrawn` en `EffectApplied`. Bonuslegers liggen per speler vast in het event (peilmoment = trekking; `EffectApplied` is daarvoor `effect_applied_v2`, zelfde wipe-afspraak als hierboven), staan tot dan op `Player.PendingEventBonus` en worden bij de volgende `PhaseChanged` naar Versterken van die speler in `ArmiesGranted` meegenomen. Een `ArmyAttrition`-kaart met minstens één speler met keuzevrijheid opent met `AttritionStarted` de `PendingAttrition` (in `GameState.EventRound`, samen met de laatst getrokken kaart en de trekstapel) en **sluit `TurnState`** (`null`): zo weigeren alle beurtguards en de timer-service vanzelf, en kan een late timer-tick of een dubbele `EndTurn` geen tweede trekking veroorzaken. `PendingAttrition` bewaart de volgende speler, omdat die zonder `TurnState` niet meer af te leiden is. Elke keuze wordt een `ArmiesRemoved`; de laatste start de beurt van de volgende speler, met versterkingen berekend op de state ná de attrition.

Dit is de eerste plek waar meerdere spelers tegelijk naar dezelfde stream schrijven. **Commando's op hetzelfde spel lopen na elkaar** (herzien 2026-10-01): elke command handler laadt de state via `GameWriteLock.LoadForWritingAsync`, die eerst een transactie opent en een Postgres advisory lock op het spel-id neemt (`pg_advisory_xact_lock`, met een eigen namespace-sleutel zodat hij niet botst met Martens eigen locks, en een `lock_timeout` van 10 s zodat een hangende houder een fout oplevert in plaats van een stilstaand spel), vrij bij opslaan of bij het sluiten van de sessie zonder opslaan. Zo beslist een tweede commando altijd op de state ná het eerste. De eerdere aanname dat Marten een gelijktijdige append zelf weigert, klopte niet: Marten bepaalt het versienummer pas bij het opslaan, dus twee commando's die op dezelfde verouderde state beslisten, sloegen allebei op en de beslissing van het eerste ging verloren (een lost update — zichtbaar als een attrition-ronde die bleef wachten). De lock geldt ook over serverinstanties heen. `ConcurrencyRetry` (verse sessie, state herladen, opnieuw beoordelen, hooguit 3 pogingen) blijft als vangnet op de paden waar spelers bewust tegelijk handelen.

**Van beurteinde naar volgende beurt: één plek (`TurnAdvancer`).** Alles tussen het einde van een beurt en het begin van de volgende — `TurnEnded`, missie-/laatste-kans-afhandeling, de volgende speler bepalen, de gebeurtenisronde op de rondegrens en `PhaseChanged` naar Versterken — zit in één scoped service. Elk pad dat een beurt beëindigt gebruikt hem — `EndTurn`, de laatste `RemoveArmies`, `SetAutoPass`, de host-uitval uit `HostAbsenceBackgroundService` en het afronden van een afgebroken beurt (hieronder) — zodat FO §6.2 maar op één plek bestaat.

**Laatste-kans-venster en auto-pass.** Bij elk beurteinde worden de resterende tegenstanders van een lopend `PendingWin` opnieuw gefilterd op niet uitgeschakeld én niet op auto-pass — ongeacht of de speler wiens beurt eindigt zelf nog in de lijst stond. Is de lijst daarna leeg (en de missie nog vervuld), dan volgt `GameWon`, vóór een eventuele gebeurtenisronde. Zo telt wie tijdens een venster op auto-pass gaat "vanaf dat moment" als al geweest (FO §6.2), en valt de winst niet pas na diens automatische beurt.

**Afgebroken beurt.** Gaat de actieve speler op auto-pass, dan kan zijn beurt niet altijd meteen eindigen: een gegooide aanval die op een menselijke verdediger wacht, moet eerst uitgespeeld worden (FO §11.2). Daarvoor is geen extra state nodig: "de actieve speler staat op auto-pass" is de markering. Elk command dat een gevecht afrondt (`ChooseDefenseDice`, en een automatische verdediging) kijkt daarnaar en sluit in dezelfde batch de beurt af — minimum meeverplaatsen bij een verovering, het timeout-pad (`CardTradeReversal`) en `TurnAdvancer` — zodat de hervatte beurttimer nooit gaat lopen. Heft `RejoinGame` de auto-pass eerder op, dan valt de markering weg en speelt de speler zijn beurt gewoon verder.

**Automatische beurt (auto-pass, FO §11.2).** Is de volgende speler op auto-pass, dan speelt `TurnAdvancer` diens beurt in dezelfde batch af met de gewone events: `PhaseChanged` naar Versterken (met `ArmiesGranted`, dus ook een openstaande gebeurtenisbonus), zo nodig `CardsTraded`, `ArmiesReinforced` per gebied en `TurnEnded`. Welke inleg en welke plaatsingen, berekent de rules engine vooraf (`AutoPassPlanner`); de projectie vouwt alleen. Het beurteinde controleert de missies van de anderen, maar niet de `requiresOwnTurn`-missie van de auto-pass-speler, en de speler telt in een laatste-kans-venster als "al geweest". Daarna door naar de volgende speler (rondegrens incluis), tot er een speler zonder auto-pass aan de beurt is of een attrition-keuze op een mens wacht. De lus stopt altijd, want `SetAutoPass` laat nooit iedereen op auto-pass achter. Verdedigen en attrition-keuzes van een auto-pass-speler lopen op dezelfde manier via de bestaande events (`CombatResolved` resp. `ArmiesRemoved`), direct in het command dat erom vraagt.

**`AutoPassEnabled` / `AutoPassDisabled` / `HostTransferred`.** `AutoPassEnabled` draagt de reden (`Host` of `Disconnected`, voor het spelverloop). `HostTransferred` verschijnt in dezelfde batch als `AutoPassEnabled(Disconnected)`, zodat er nooit een host op auto-pass bestaat; alleen bij een uitgeschakelde host staat het alleen (FO §11.1). `Player.IsAutoPass` is een nieuw veld met standaardwaarde `false`: een bestaand document zonder dat veld laadt als `false` en oude streams bevatten de nieuwe events niet, dus deze wijziging is achterwaarts compatibel — geen wipe nodig. `AutoPassReason` wordt als getal opgeslagen (Martens standaard, net als `TurnPhase`): alleen achteraan uitbreiden.

De **geprojecteerde `GameState`** (§3.1) is een Marten-projectie (inline of async) over deze events. Clients krijgen nooit de ruwe events, alleen de projectie of deltas daarvan.

**Events dragen hun eigen uitkomst.** Een event bevat niet alleen wat er gebeurde maar ook wat het opleverde, berekend door de rules engine vóórdat het event ontstond: `PhaseChanged` draagt de toegekende versterkingen, `CardsTraded` de setwaarde, de bezitsbonussen en de volgende inlegwaarde. De projectie rekent dus niets uit, ze vouwt alleen. Zou de opbrengst pas bij het vouwen berekend worden, dan zou een latere wijziging van bijvoorbeeld de versterkingsformule of de inlegtabel met terugwerkende kracht de uitkomst van al gespeelde partijen veranderen.

**Streams van vóór die wijziging worden niet ondersteund.** Ze missen die velden en zouden bij een replay stilzwijgend naar `null`/`0` deserialiseren — een speler die zonder versterkingen begint, zonder foutmelding. `PhaseChanged` en `CardsTraded` zijn daarom hernoemd naar `phase_changed_v2` en `cards_traded_v2` (`GameStoreFactory`), zodat een oude stream bij een replay hard faalt in plaats van stil verkeerd te vouwen. De database wordt bij het uitrollen van deze wijziging leeggegooid; dit is pre-release-testdata, er is bewust geen upcast-pad gebouwd.

**Aanvalsworp in de state (herwerp-stap, FO §5.3 stap 3).** `AttackDeclared` draagt de aanvalsworp (`AttackerRolls`) en de door de commandhandler bepaalde vlag `AwaitingRerollDecision` — de projectie past ook hier alleen toe, ze raadpleegt geen rol-effecten. Het wordt daarom `attack_declared_v2`, met dezelfde wipe-afspraak als hierboven. `DiceRolled` blijft bestaan als puur audit-/TV-narratiefeit zonder vouwregel; de worp in `PendingCombat.AttackerRolls` is leidend voor `ChooseDefenseDice`. `AttackDieRerolled` (met de oude worp, de herworpen index, de nieuwe waarde en de nieuwe gesorteerde worp — `CombatResolver.RerollDie` sorteert opnieuw, dus een kale index is na de herwerp betekenisloos) vervangt `AttackerRolls`, sluit de herwerp-stap en voegt het doelgebied toe aan `TurnState.RerolledTargetTerritoryIds`; `AttackDiceKept` sluit alleen de stap. Beide zijn idempotent ten opzichte van elkaar: een tweede sluit-event op een al gesloten stap is een no-op, want de commandhandlers gebruiken geen expected-version en twee gelijktijdige beslissingen van dezelfde aanvaller kunnen allebei slagen. `RerolledTargetTerritoryIds` en `FortifiesUsed` leven in `TurnState` en beginnen leeg/0 bij elke fase-intrede (`PhaseChanged` bouwt altijd een nieuwe `TurnState`); Aanvallen en Verplaatsen zijn elk één fase per beurt, dus dat is per beurt.

### 5.3 Timer-afhandeling

De beurttimer (FO §5.4) is **server-side gezaghebbend**: de server handhaaft de timeout, zodat een client die zijn tabblad sluit de beurt niet kan ophangen. Clients tonen een afteller die met de server gesynchroniseerd wordt, maar de client-klok is puur cosmetisch.

De verantwoordelijkheid ligt bewust op twee plekken:

- **De rules engine** houdt alleen de **resterende tijd** bij (`PhaseTimer`: resterend + gepauzeerd), nooit een absolute deadline. Verstreken tijd komt binnen via een `Tick`. Daardoor heeft `RiskGame.Rules` geen klok-abstractie nodig, is hij ongevoelig voor een verspringende serverklok, en zijn timerregels zonder test-double reproduceerbaar.
- **De API-laag** telt af: die houdt bij wanneer de fase begon en brengt het verstrijken van tijd als commando de engine in.

Pauzeren is daarmee één regel: een `Tick` op een gepauzeerde timer verandert niets. De timer pauzeert bij `DeclareAttack` en blijft dat voor de hele belegering van dát doelgebied — ook over meerdere achtereenvolgende worpen heen — en hervat bij volledige afhandeling (verovering + meeverplaatsing), bij `AbandonAttack` ("Ander gevecht", het handmatig opgeven van de belegering zonder meteen een nieuw doelgebied te kiezen), of zodra de aanvaller alsnog een ánder doelgebied aanvalt terwijl de timer nog van de vorige belegering bevroren stond (FO §5.4, herzien 2026-08-04). `TurnState.PausedAttackTarget` (`RiskGame.Rules.State.AttackEngagement`) houdt bij voor welk gebiedspaar de pauze geldt; `PhaseTimer.ResumeAndTick` verrekent in één stap de tijd die verstrijkt tussen het opgeven van de belegering (via `AbandonAttack` of een `DeclareAttack` op een ander gebiedspaar) en het moment van hervatten.

---

## 6. Realtime-laag (SignalR)

### 6.1 Groepen

Per spel drie logische doelgroepen binnen de SignalR-hub:

- **`game-{id}-tv`** — de TV; krijgt de volledige publieke state (bord, beurt, alle acties visueel).
- **`game-{id}-player-{playerId}`** — één telefoon; krijgt de publieke state **plus** die spelers privé-info (kaarten, geheime missie).
- **`game-{id}-all`** — broadcast voor globale gebeurtenissen (event-kaart getrokken, winnaar).

**Privacy-grens:** geheime missies en handkaarten worden **uitsluitend** naar de eigen speler-groep gepusht, nooit naar de TV-groep of een andere speler. Dit wordt server-side afgedwongen bij het samenstellen van de push, niet client-side verborgen. **Eén expliciete uitzondering:** zodra de spelfase `Finished` is, geeft de TV-groep wél ieders geheime missie mee — FO §7 eist dat de TV bij spelwinst "de missie-onthulling van alle spelers" toont. Handkaarten blijven ook dan buiten de TV-push; alleen missies worden op dat moment publiek. Vóór `Finished` geldt de regel hierboven onverkort.

### 6.2 State-synchronisatie

Na elke succesvolle commando-verwerking pusht de server een **delta** (of, bij twijfel/reconnect, de volledige state). De client past die toe op zijn lokale kopie en rendert opnieuw. De client muteert **nooit** zelf de gezaghebbende state — hij toont alleen wat de server bevestigt.

### 6.3 Reconnect (FO §11.1)

SignalR's automatische reconnect + een `sessionToken` in `sessionStorage` (per tab, zelfde schaal als `playerId` — bewust niet `localStorage`: dat zou gedeeld zijn tussen tabs en daarmee spelersidentiteiten door elkaar halen zodra iemand meerdere spelers vanaf één machine test/speelt). `JoinGame` geeft het token eenmalig terug aan de aanroepende connectie; `RejoinGame` vereist het om de eigen `Hand`/`MissionId` weer te mogen zien (§6.1) en om opnieuw aan `game-{id}-player-{playerId}` gekoppeld te worden. Zonder geldig token (nog geen sessie bekend, of een andere client die alleen de publieke `playerId` kent) degradeert `RejoinGame` naar de publieke, tv-achtige weergave — nooit een foutmelding. Met een geldig token registreert `RejoinGame` de connectie in `PlayerPresenceRegistry` (§4.1) en heft het een auto-pass op (FO §11.2): in een `InProgress`-spel waarin de speler op auto-pass staat appendt het `AutoPassDisabled` en pusht de nieuwe state naar iedereen. Dat is de enige plek waar `RejoinGame` schrijft. Het loopt via dezelfde retry als de andere commando's; mislukt het toch, dan wordt het gelogd en krijgt de telefoon gewoon zijn state terug — herverbinden mag nooit op het opheffen van auto-pass stuklopen. **Nog niet gebouwd:** bij een nieuw apparaat naam invoeren om aan een bestaande positie te koppelen en het oude token te invalideren — een apart vervolgstuk.

---

## 7. Frontend-architectuur

### 7.1 Twee apps, één codebase

TV en telefoon zijn twee views/routes binnen dezelfde React-app, met gedeelde SignalR-client en typedefinities. De TV is read-only (rendert state, stuurt nooit commando's); de telefoon is de enige input-bron.

### 7.2 De kaartlaag (glas-laag, sinds 2026-08-07)

```
z-0: gedeelde stage-illustratie (TvStageBackground) + eigen map-scrim  (sfeerbeeld, geen kaartartwork)
z-1: <svg> gebieden uit territories.geo.json  (per-eigenaar-kleurbaar, klikbaar/highlightbaar)
z-2: legertellers + labels op de centroids
z-3: transiënte animaties (dobbelstenen, aanvalspijlen, veroveringen)
```

**Wat dit niet verandert:** de projectieformule (`build_silhouette_v4.py`, lengtegraadbereik
**−180° tot 191°** i.p.v. de standaard −180°/180°, nodig om Kamchatka's oostpunt aaneengesloten
te houden) blijft ongewijzigd in `projection.ts` (`LON_MIN`/`LON_MAX`/`LAT_MIN`/`LAT_MAX`) — die
bepaalt de vorm/continuïteit van de polygonen zelf, niet een uitlijning met een artwork-asset.

**Vervallen (historisch, niet meer van toepassing):** de asset-specifieke venster-fit en
IoU-metingen van 2026-08-03 (overlay-tegen-artwork-overlap, Kamtsjatka-dekking van de
PNG, de cosmetische Indonesië/Filipijnen-afwijkingen) kalibreerden de overlay tegen de
pixels van `map-background-final.png`. Zonder die achtergrond vervalt het "overlay vs.
artwork"-vergelijkingspunt volledig; er is geen equivalente meting nodig omdat er geen
tweede, onafhankelijke kaartweergave meer is om tegen uit te lijnen.

De gebiedenlaag hangt sinds 2026-08-03 in het `atlasRough`-SVG-filter uit het oorspronkelijke TV-design (`feTurbulence`+`feDisplacementMap`, "roughened for organic coastlines") — dit roughened de polygoonrand zodat de vormvereenvoudiging van de 43 gebiedspolygonen visueel als handgetekende kustlijn oogt. De prestatie-impact van dit filter op de daadwerkelijke TV-hardware (zwakke GPU, zie frontend/CLAUDE.md) is nog niet gemeten.

### 7.3 Gebiedsselectie

Conform FO §2.3: de telefoon toont **nooit** een kaart om op te tikken, altijd een knoppenlijst van geldige opties. De TV highlight de corresponderende gebieden in de SVG-laag. Beide lijsten komen van dezelfde server-berekende set geldige opties.

### 7.4 Vertalingen (i18n)

`nl`/`en` via i18next/react-i18next. Bron van waarheid is een key-first
boomstructuur per namespace in `frontend/src/locales/*.ts`
(`{ key: { nl, en } }`), die bij app-init in het geheugen naar i18next-resources
wordt geëxpandeerd (`frontend/src/i18n/expand.ts`) — er zijn geen losse
`nl.json`/`en.json`-bestanden.

**Bewust uitgesteld:** een exportscript dat de key-first bron naar platte
per-taal JSON-bestanden splitst (bv. voor lazy-loading per taal, of om
vertalers een los bestand te geven) heeft nu geen concrete afnemer — alle
resources worden inline gebundeld. Bouw dit pas zodra een van die twee
gevallen zich daadwerkelijk voordoet (bv. bij een merkbare bundle-omvang door
extra talen, of een externe vertaalworkflow), niet vooruitlopend erop.

---

## 8. Beveiliging & integriteit

- **Rate limiting** op `JoinGame` (fixed-window per IP, `JoinGameRateLimitFilter`) tegen brute-forcen van de 6-teken gamecode. Geen HTTP-middleware: joinen loopt uitsluitend via de SignalR-hub, geen apart endpoint — vandaar een `IHubFilter` i.p.v. ASP.NET Core's HTTP-rate-limiting. `Program.cs` vertrouwt via `UseForwardedHeaders` de front-end-hop van Azure App Service onvoorwaardelijk: de container heeft zelf geen publiek IP en is alleen via die hop bereikbaar, dus kan een client die niet omzeilen om zelf een `X-Forwarded-For` te vervalsen. Zie `docs/azure-hosting-deployment.md`.
- **Neon (managed Postgres) is publiek bereikbaar over TLS**, niet netwerk-geïsoleerd zoals de eerder overwogen lokale compose-opstelling. De beveiligingsgrens is de connection string (credentials in App Service Application Settings, nooit in `appsettings.json` of git) plus TLS-verplichte verbinding en Neon's eigen toegangscontrole.
- **Geen client-vertrouwen**: alle validatie en dobbelen server-side (§4, §4.2).
- **Privacy-grens** op privé-info afgedwongen in de push-laag (§6.1).
- **Sessietokens** (§6.3) bewijzen identiteit bij `RejoinGame`. Invalideren bij apparaatwissel is nog niet gebouwd (zie §6.3).

---

## 9. Teststrategie

| Laag | Aanpak |
|---|---|
| Rules engine | Unit tests met een **vaste-seed `IRandomSource`**, zodat dobbeluitkomsten deterministisch zijn. Dekkend voor: aanval/verdediging-matrix, fortify-padvinding, kaartset-waardering + escalatie, missie-evaluatie (incl. `requiresOwnTurn` en `EliminatePlayer`-fallback), `SeaRoutesBlocked`-lege-fase-afhandeling, continentbonus-berekening. |
| Adjacency-data | Reeds geautomatiseerd gevalideerd (`validate_adjacency.py`): elke land-grens raakt geometrisch, geen rakend paar buiten de lijst, volledige connectiviteit. Als regressietest opnemen. |
| Event sourcing | Round-trip: reeks commando's → events → projectie; daarna stream replayen en bevestigen dat de projectie identiek is (herstel-garantie). |
| Integratie | Volledige beurt end-to-end via de API/hub met meerdere gesimuleerde clients. |
| E2E (later) | Playwright over de echte frontend; reconnect-scenario's expliciet. |

**Bouwvolgorde-koppeling:** stap 1 uit `project-overzicht-risk.md` (rules engine als losse library met unit tests) hangt volledig op deze eerste testlaag — die is de fundering waar de rest op rust.

---

## 10. Technische beslissingen

### 10.1 Inmiddels besloten (geïmplementeerd)

1. ~~**Marten-projectie: inline vs. async.**~~ **Besloten: inline** (`ProjectionLifecycle.Inline` in `GameStoreFactory`). Past bij één-huiskamer-schaal; async is hier niet nodig gebleken.
2. ~~**Delta- vs. full-state-push.**~~ **Besloten: full-state.** `IGameClient.GameStateUpdated(GameStateDto state)` pusht de volledige projectie na elk commando; `DiceRolled`/`CombatNarrated` zijn losse, gerichte pushes voor animatie-timing (TV-narratie). Nog geen delta's — voor 43 gebieden + ≤7 spelers blijkt dit in de praktijk klein genoeg.
3. ~~**Rollen/missies/events-content**~~ **Ingevuld**, zie FO §13: `roles.json` (15 rollen), `missions.json` (dekkend voor 7 kleuren), `events.json` (incl. `TerritoryLocked`/`ArmyAttrition`).
4. ~~**44- vs. 42-gebieden** (Nieuw-Zeeland/Chili)~~ **Besloten: 43 gebieden.** Alleen Nieuw-Zeeland is toegevoegd (continent Australië); Chili blijft onderdeel van `peru`. Verwerkt in de data: 84 grenzen (twee nieuwe zeeroutes, zie FO §4.2; sinds de herziening van 2026-09-26 86), continentbonus Australië van 2 naar 3, en een 43e territoriumkaart met `symbol-1` (deck 45). `territories_extended.*` blijft ongewijzigd als uitbreidbaarheidsbewijs en is géén speeldata.
### 10.2 Nog open

1. **Timer-synchronisatie-precisie.** Hoe strak moeten client- en serverklok lopen? Voor een informeel spel volstaat vermoedelijk "server handhaaft, client toont benadering" — nog niet apart getest tegen een trage/instabiele verbinding (relevant voor Azure App Service/Vercel, zie project-overzicht §2.3).
2. **Delta-push alsnog nodig?** Blijft full-state-push (§10.1.2) presterend genoeg zodra de echte kaartlaag (§7.2) met SVG-animaties erbij komt? Pas heroverwegen als dat in de praktijk hapert.

---

## 11. Bouwvolgorde (uit `project-overzicht-risk.md`, hier technisch geduid) — status

1. **Rules engine** (pure C#-library + unit tests) — ✅ gedaan. `RiskGame.Rules` + `RiskGame.Rules.Tests` (34 testbestanden, ~575 cases), geen transport, geen persistentie.
2. **Event sourcing eromheen** (Marten) — ✅ gedaan. `RiskGame.Persistence`: commando's → events → inline `GameProjection`, met round-trip-tests in `RiskGame.Persistence.Tests`.
3. **Minimal API + SignalR-hub** — ✅ gedaan. `RiskGame.Api`: `GameEndpoints`/`HubEndpoints`, `GameHub` + `IGameClient`, commandohandlers per fase, `TurnTimerBackgroundService`; getest incl. `PostgresFixture`.
4. **Frontend met placeholder-kaart** (rechthoeken) — 🔶 gedeeltelijk. Lobby, joinen, kleur-/rolkeuze en order-roll staan (met i18n en TV-motion); het speelbord zelf (versterken/aanvallen/verplaatsen, ook als placeholder) is nog niet gebouwd.
5. **Echte kaartlaag**: SVG-overlay met de v4-projectie over de gedeelde stage-illustratie (zie §7.2) — ⬜ nog niet gestart. `frontend/src/map/` bevat alleen een `.gitkeep`.
6. **Reconnect & randgevallen** — 🔶 grotendeels aanwezig: sessietoken + groepen zijn nu écht geverifieerd bij `RejoinGame` (§6.3), rate limiting op `JoinGame` staat (§8). Auto-pass (`SetAutoPass`, aanwezigheid, host-overdracht — §4.1, §5.2, §6.3) is in opbouw op `feat/auto-pass`. Apparaatwissel (token invalideren bij een nieuw apparaat) is nog niet gebouwd.

