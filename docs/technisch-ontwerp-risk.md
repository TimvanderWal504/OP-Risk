# Technisch Ontwerp — Digitaal Risk

**Versie:** 1.1 · **Datum:** 27 juli 2026 · **Status:** Grotendeels geïmplementeerd (bouwstappen 1–3, zie §11); frontend-kaartlaag (stap 5) nog te bouwen
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
| Hosting | Proxmox (Plan B) via Tailscale Funnel; later optioneel Azure | Zie `plan-b-reisopstelling.md` |

---

## 3. Domeinmodel (rules engine)

De rules engine is een **pure, deterministische** C#-library: dezelfde input geeft altijd dezelfde output, met één uitzondering — dobbelworpen — die via een geïnjecteerde `IRandomSource` lopen zodat ze in tests vervangbaar zijn door een vaste seed.

### 3.1 Kernentiteiten (conceptueel)

```
GameState
├─ GameId
├─ Phase            (Lobby | OrderRoll | Claiming | InitialPlacement | InProgress | Finished)
├─ Settings         (winconditie, startopstelling, startlegers, timer, feature-toggles)
├─ Players[]        (id, naam, kleur, rol?, missie?, kaarten[], isEliminated, isAutoPass)
├─ Territories[]    (territoryId → ownerPlayerId, armyCount)
├─ TurnState        (activePlayerId, currentPhase, timer? {resterend, gepauzeerd}, pendingCombat?)
├─ Deck             (trekstapel, aflegstapel, volgende inleg-waarde)
├─ ActiveEffects[]  (lopende event-effecten met resterende duur)
└─ TurnOrder[]      (spelersvolgorde, bepaald door de order-roll)
```

Let op: dit is de **geprojecteerde** state (het "nu"). De bron van waarheid is de event-stream (§5); deze state is een projectie daarvan.

### 3.2 Statische speldata (read-only, geladen bij opstart)

Deze bestanden zijn de gevalideerde output uit het ontwerp-traject en worden bij het aanmaken van een spel ingelezen, niet in code gehardcodeerd. Ze staan **per kaartvariant** onder `data/maps/{mapId}/`, zodat de host straks in de lobby tussen varianten kan kiezen zonder dat er code verandert. Uitzondering: `colors.json` is **gedeeld over alle kaartvarianten** (de spelerskleuren-catalogus verschilt niet per kaart) en staat daarom in `data/colors.json`, één niveau boven `data/maps/`. De eerste variant is **`standaard-43`**:

| Bestand | Rol in de engine |
|---|---|
| `territories.json` | 43 gebieden: id, naam, continent, centroid |
| `territories.geo.json` | Polygon-geometrie per gebied (frontend-render + klik-detectie) — niet door de engine geladen |
| `adjacency_validated.json` | 84 grenzen (`from`, `to`, `type: land\|sea`) — de aangrenzingsgraaf |
| `continents.json` | Continentbonussen |
| `colors.json` (gedeeld, `data/colors.json`) | 7 spelerskleuren: `hex` (fill) + `onHex` (contrastkleur voor tekst/symbool erop) + kleurenblind-symbolen |
| `cards.json` | Set-regels, inleg-thema's, `ownedTerritoryBonus`, `deck.symbols` en `deck.jokerCount` — het deck zelf wordt afgeleid uit de gebieden (FO §4.4) |
| `map-background-final.png` | Statische achtergrond voor de TV-kaart (hoort bij de projectie van deze variant) |
| `roles.json` / `missions.json` / `events.json` | Rollen, missies en gebeurteniskaarten — datamodel én content ingevuld (FO §13) |

De engine bevat **geen** kaart-, kleur- of kaartkennis in code; alles komt uit deze bestanden. Dat is de kern van "data-driven" uit het FO: een nieuwe kaart of extra gebied = andere data, geen codewijziging.

`MapDefinitionParser.Parse(mapId, sources)` levert per aanroep een nieuwe, onafhankelijke `MapDefinition`; er is geen static of gedeelde cache, zodat twee gelijktijdige spellen met verschillende varianten elkaar niet kunnen beïnvloeden. De parser neemt **JSON-tekst** aan, geen paden: het lezen van bestanden gebeurt buiten `RiskGame.Rules`, dat daarmee vrij van I/O blijft.

### 3.3 Aangrenzing & het `SeaRoutesBlocked`-effect

De adjacency-graaf wordt bij opstart uit `adjacency_validated.json` in een `Dictionary<string, List<Border>>` geladen (beide richtingen). Twee bevragingen die de engine nodig heeft:

- **`GetAttackableTargets(from)`** — buren van `from` in bezit van een ándere speler, minus geblokkeerde zeeroutes als `SeaRoutesBlocked` actief is.
- **`GetFortifyPath(from, to)`** — bestaat er een aaneengesloten pad via **eigen** gebieden? (moderne fortify, FO §5.2). BFS over de graaf, beperkt tot gebieden van de actieve speler, met dezelfde zee-blokkade-filter.

**`SeaRoutesBlocked`-afhandeling (FO §9.2):** het effect filtert `type: "sea"`-grenzen weg. Ondersteunt de optionele `routes`-parameter voor gedeeltelijke blokkade. **Kritisch (uit de review, C3):** als een speler door de blokkade nul geldige aanvallen én nul geldige verplaatsingen heeft, slaat de engine die fase automatisch over met een expliciete melding — dit is bedoeld gedrag, geen bug. Getest scenario: 6 eilandgebieden (Groenland, IJsland, Groot-Brittannië, Japan, Madagaskar, Nieuw-Guinea) raken volledig geïsoleerd bij volledige blokkade.

---

## 4. Commando's & validatie

Elke speleractie is een **commando** dat de client naar de server stuurt. De server draait per commando dezelfde pijplijn:

```
Commando binnen (SignalR)
      │
      ▼
1. Authenticatie   → hoort dit token bij deze speler in dit spel?
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

| Commando | Fase | Kernvalidatie |
|---|---|---|
| `JoinGame` | Lobby | Gamecode geldig, plek vrij, kleur vrij |
| `ChooseColor` | Lobby | Kleur nog niet bezet |
| `RollForOrder` | OrderRoll | Speler heeft nog niet geworpen |
| `ClaimTerritory` | Claiming | Gebied is vrij, het is spelers beurt |
| `PlaceInitialArmy` | InitialPlacement | Speler heeft nog startlegers, gebied is van hem |
| `TradeCards` | Reinforce | Geldige set (`cards.json`-regels), verplicht bij 5+ kaarten |
| `PlaceArmies` | Reinforce | Aantal ≤ beschikbare versterkingen, gebied van speler |
| `DeclareAttack` (= "Gooi") | Attack | Van-gebied ≥ 2 legers, doel is vijandelijke buur, #dobbelstenen ≤ legers−1 (max 3) |
| `ChooseDefenseDice` | Attack (verdediger) | 1 of 2; bij 1 verdedigend leger gedwongen 1 |
| `MoveAfterConquest` | Attack | ≥ gebruikte aanvalsdobbelstenen, ≤ (bron−1) |
| `Fortify` | Fortify | Pad via eigen gebieden bestaat, ≥ 1 leger blijft achter |
| `EndPhase` / `EndTurn` | diverse | Speler is aan de beurt |
| `SetAutoPass` (host) | elke | Aanroeper is host; doel is afwezige speler |
| `VoteReplay` / `HostRestart` (host) | Finished | — |

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
CardsTraded, ArmiesReinforced, AttackDeclared, DiceRolled, CombatResolved,
TerritoryConquered, ArmiesMovedAfterConquest, Fortified,
CardDrawn, PlayerEliminated, EventCardDrawn, EffectApplied, EffectExpired,
PhaseChanged, TurnEnded, MissionCompleted, GameWon
```

De **geprojecteerde `GameState`** (§3.1) is een Marten-projectie (inline of async) over deze events. Clients krijgen nooit de ruwe events, alleen de projectie of deltas daarvan.

**Events dragen hun eigen uitkomst.** Een event bevat niet alleen wat er gebeurde maar ook wat het opleverde, berekend door de rules engine vóórdat het event ontstond: `PhaseChanged` draagt de toegekende versterkingen, `CardsTraded` de setwaarde, de bezitsbonussen en de volgende inlegwaarde. De projectie rekent dus niets uit, ze vouwt alleen. Zou de opbrengst pas bij het vouwen berekend worden, dan zou een latere wijziging van bijvoorbeeld de versterkingsformule of de inlegtabel met terugwerkende kracht de uitkomst van al gespeelde partijen veranderen.

**Streams van vóór die wijziging worden niet ondersteund.** Ze missen die velden en zouden bij een replay stilzwijgend naar `null`/`0` deserialiseren — een speler die zonder versterkingen begint, zonder foutmelding. `PhaseChanged` en `CardsTraded` zijn daarom hernoemd naar `phase_changed_v2` en `cards_traded_v2` (`GameStoreFactory`), zodat een oude stream bij een replay hard faalt in plaats van stil verkeerd te vouwen. De database wordt bij het uitrollen van deze wijziging leeggegooid; dit is pre-release-testdata, er is bewust geen upcast-pad gebouwd.

### 5.3 Timer-afhandeling

De beurttimer (FO §5.4) is **server-side gezaghebbend**: de server handhaaft de timeout, zodat een client die zijn tabblad sluit de beurt niet kan ophangen. Clients tonen een afteller die met de server gesynchroniseerd wordt, maar de client-klok is puur cosmetisch.

De verantwoordelijkheid ligt bewust op twee plekken:

- **De rules engine** houdt alleen de **resterende tijd** bij (`PhaseTimer`: resterend + gepauzeerd), nooit een absolute deadline. Verstreken tijd komt binnen via een `Tick`. Daardoor heeft `RiskGame.Rules` geen klok-abstractie nodig, is hij ongevoelig voor een verspringende serverklok, en zijn timerregels zonder test-double reproduceerbaar.
- **De API-laag** telt af: die houdt bij wanneer de fase begon en brengt het verstrijken van tijd als commando de engine in.

Pauzeren is daarmee één regel: een `Tick` op een gepauzeerde timer verandert niets. De timer pauzeert bij `DeclareAttack` en hervat na volledige gevechtsafhandeling.

---

## 6. Realtime-laag (SignalR)

### 6.1 Groepen

Per spel drie logische doelgroepen binnen de SignalR-hub:

- **`game-{id}-tv`** — de TV; krijgt de volledige publieke state (bord, beurt, alle acties visueel).
- **`game-{id}-player-{playerId}`** — één telefoon; krijgt de publieke state **plus** die spelers privé-info (kaarten, geheime missie).
- **`game-{id}-all`** — broadcast voor globale gebeurtenissen (event-kaart getrokken, winnaar).

**Privacy-grens:** geheime missies en handkaarten worden **uitsluitend** naar de eigen speler-groep gepusht, nooit naar de TV-groep of een andere speler. Dit wordt server-side afgedwongen bij het samenstellen van de push, niet client-side verborgen.

### 6.2 State-synchronisatie

Na elke succesvolle commando-verwerking pusht de server een **delta** (of, bij twijfel/reconnect, de volledige state). De client past die toe op zijn lokale kopie en rendert opnieuw. De client muteert **nooit** zelf de gezaghebbende state — hij toont alleen wat de server bevestigt.

### 6.3 Reconnect (FO §11.1)

SignalR's automatische reconnect + een `sessionToken` in `localStorage`. Bij herverbinding: client stuurt token → server herkent de spelerspositie → stuurt de volledige actuele state. Bij een nieuw apparaat: naam invoeren → server koppelt aan de bestaande positie en invalideert het oude token.

---

## 7. Frontend-architectuur

### 7.1 Twee apps, één codebase

TV en telefoon zijn twee views/routes binnen dezelfde React-app, met gedeelde SignalR-client en typedefinities. De TV is read-only (rendert state, stuurt nooit commando's); de telefoon is de enige input-bron.

### 7.2 De kaartlaag (hybride, zoals uitgewerkt)

```
z-0: <img> map-background-final.png        (statische artwork-achtergrond)
z-1: <svg> gebieden uit territories.geo.json  (per-eigenaar-kleurbaar, klikbaar/highlightbaar)
z-2: legertellers + labels op de centroids
z-3: transiënte animaties (dobbelstenen, aanvalspijlen, veroveringen)
```

**Cruciaal (uit de kaart-look-iteraties):** de SVG-gebiedenlaag moet exact **dezelfde projectie** gebruiken als waarmee `map-background-final.png` is gegenereerd — het v4-silhouet met lengtegraadbereik **−180° tot 191°** (i.p.v. de standaard −180°/180°), nodig om Kamchatka's oostpunt aaneengesloten te houden. Wijkt de overlay-projectie hiervan af, dan schuiven de klikbare gebieden en de achtergrond uit elkaar. De projectieformule staat in `build_silhouette_v4.py` en is de basis voor de frontend; sinds 2026-08-03 zijn de vier venstergrenzen in `projection.ts` (`LON_MIN`/`LON_MAX`/`LAT_MIN`/`LAT_MAX`) echter gefit op de daadwerkelijke `map-background-final.png` in plaats van 1-op-1 uit het script overgenomen (zie hieronder) — vervang je de asset, dan moet die fit herhaald worden.

Bekende, geaccepteerde cosmetische afwijkingen tussen achtergrond en overlay: Indonesië/Filipijnen en een lichte schim langs de onderrand. De klik-detectie blijft correct (die volgt de geodata); alleen valt de geschilderde kust daar niet exact samen met het klikvlak.

**Meting 2026-08-03 (asset-wissel + venster-fit):** met de huidige `map-background-final.png` en een IoU-grid-search over het projectievenster is het codeplafond voor overlay/artwork-overlap **IoU ≈ 0,825** (was 0,709 met de vorige asset en het nominale −180/191-venster). Een losse translatie per continent bovenop de globale venster-fit levert geen extra winst op (+0,000 voor elk continent) — het restverschil is een vormverschil tussen de 43 vereenvoudigde gebiedspolygonen en de geschilderde kustlijn, niet een resterende positiefout, en is dus niet met een transform te dichten. Vertaald naar scherm-pixels op 1920×1080 is de mediane afwijking 2,1 px (p75 6,0 px, p90 18,4 px) — kleiner dan wat met het blote oog opvalt op de meeste plekken.

`map-background-final.png` schildert Kamtsjatka's oostpunt nog altijd niet volledig — dit is bevestigd met twee kandidaat-vervangingen (een 4096×2132-herexport en een los gegenereerde afbeelding) die het schiereiland allebei ófwel niet vollediger, ófwel (de herexport) juist met 23-41% minder land tekenen dan de huidige asset. Geen combinatie van venster/schaal/translatie kan dit compenseren zonder de wereldwijde IoU elders te laten instorten (geverifieerd met een sweep van `LON_MAX`). Dit is een tekortkoming van de artwork zelf, niet van de projectie of de geodata, en blijft openstaan tot er een asset is die het schiereiland wél volledig bevat.

De gebiedenlaag hangt sinds 2026-08-03 in het `atlasRough`-SVG-filter uit de export (`Host-scherm.dc.html:280`, `feTurbulence`+`feDisplacementMap`, "roughened for organic coastlines") — dit roughened de polygoonrand zodat de resterende vormafwijking visueel als handgetekende kustlijn oogt in plaats van als net-niet-kloppende uitlijning. De prestatie-impact van dit filter op de daadwerkelijke TV-hardware (zwakke GPU, zie frontend/CLAUDE.md) is nog niet gemeten.

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

- **Rate limiting** op join/lobby-endpoints (ASP.NET Core fixed-window per IP) tegen brute-forcen van de 6-teken gamecode — zie `plan-b-reisopstelling.md`.
- **PostgreSQL uitsluitend intern**; Tailscale Funnel exposeert alleen de API-poort, nooit de database.
- **Geen client-vertrouwen**: alle validatie en dobbelen server-side (§4, §4.2).
- **Privacy-grens** op privé-info afgedwongen in de push-laag (§6.1).
- **Sessietokens** invalideren bij apparaatwissel (§6.3).

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
4. ~~**44- vs. 42-gebieden** (Nieuw-Zeeland/Chili)~~ **Besloten: 43 gebieden.** Alleen Nieuw-Zeeland is toegevoegd (continent Australië); Chili blijft onderdeel van `peru`. Verwerkt in de data: 84 grenzen (twee nieuwe zeeroutes, zie FO §4.2), continentbonus Australië van 2 naar 3, en een 43e territoriumkaart met `symbol-1` (deck 45). `territories_extended.*` blijft ongewijzigd als uitbreidbaarheidsbewijs en is géén speeldata.

### 10.2 Nog open

1. **Timer-synchronisatie-precisie.** Hoe strak moeten client- en serverklok lopen? Voor een informeel spel volstaat vermoedelijk "server handhaaft, client toont benadering" — nog niet apart getest tegen een trage/instabiele verbinding (relevant voor Plan B/Tailscale, zie project-overzicht §2.3).
2. **Delta-push alsnog nodig?** Blijft full-state-push (§10.1.2) presterend genoeg zodra de echte kaartlaag (§7.2) met SVG-animaties erbij komt? Pas heroverwegen als dat in de praktijk hapert.

---

## 11. Bouwvolgorde (uit `project-overzicht-risk.md`, hier technisch geduid) — status

1. **Rules engine** (pure C#-library + unit tests) — ✅ gedaan. `RiskGame.Rules` + `RiskGame.Rules.Tests` (34 testbestanden, ~575 cases), geen transport, geen persistentie.
2. **Event sourcing eromheen** (Marten) — ✅ gedaan. `RiskGame.Persistence`: commando's → events → inline `GameProjection`, met round-trip-tests in `RiskGame.Persistence.Tests`.
3. **Minimal API + SignalR-hub** — ✅ gedaan. `RiskGame.Api`: `GameEndpoints`/`HubEndpoints`, `GameHub` + `IGameClient`, commandohandlers per fase, `TurnTimerBackgroundService`; getest incl. `PostgresFixture`.
4. **Frontend met placeholder-kaart** (rechthoeken) — 🔶 gedeeltelijk. Lobby, joinen, kleur-/rolkeuze en order-roll staan (met i18n en TV-motion); het speelbord zelf (versterken/aanvallen/verplaatsen, ook als placeholder) is nog niet gebouwd.
5. **Echte kaartlaag**: `map-background-final.png` + SVG-overlay met de v4-projectie — ⬜ nog niet gestart. `frontend/src/map/` bevat alleen een `.gitkeep`.
6. **Reconnect & randgevallen** — 🔶 serverzijde aanwezig (sessietoken, groepen, auto-pass in de rules/API-laag), end-to-end-verificatie via de frontend nog te doen.

