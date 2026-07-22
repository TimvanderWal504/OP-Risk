# Technisch Ontwerp — Digitaal Risk

**Versie:** 1.0 · **Datum:** 21 juli 2026 · **Status:** Concept
**Verwant:** `functioneel-ontwerp-risk.md` (het *wat*); dit document beschrijft het *hoe*.

---

## 1. Architectuuroverzicht

Server-authoritative client-server-model. De server is de enige bron van waarheid: alle spelregels, dobbelworpen, validaties en state-overgangen gebeuren server-side. Clients (TV en telefoons) zijn "domme" weergaves die commando's sturen en state-updates ontvangen.

```
┌──────────────┐   SignalR (WebSocket)   ┌────────────────────────────┐
│  TV (host)   │◀───── state push ───────│                            │
│  React SPA   │                         │   .NET Minimal API         │
└──────────────┘                         │   + SignalR hub            │
                                         │   + Rules engine (pure C#) │
┌──────────────┐   commando's ──────────▶│   + Marten (event store)   │
│  Telefoon(s) │◀───── state push ───────│                            │
│  React SPA   │                         └─────────────┬──────────────┘
└──────────────┘                                       │
                                              ┌────────▼────────┐
                                              │  PostgreSQL      │
                                              │  (Marten docs +  │
                                              │   event streams) │
                                              └──────────────────┘
```

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
├─ TurnState        (activePlayerId, currentPhase, timerDeadline, pendingCombat?)
├─ Deck             (trekstapel, aflegstapel, volgende inleg-waarde)
├─ ActiveEffects[]  (lopende event-effecten met resterende duur)
└─ TurnOrder[]      (spelersvolgorde, bepaald door de order-roll)
```

Let op: dit is de **geprojecteerde** state (het "nu"). De bron van waarheid is de event-stream (§5); deze state is een projectie daarvan.

### 3.2 Statische speldata (read-only, geladen bij opstart)

Deze bestanden zijn de gevalideerde output uit het ontwerp-traject en worden bij het aanmaken van een spel ingelezen, niet in code gehardcodeerd:

| Bestand | Rol in de engine |
|---|---|
| `territories.json` | 43 gebieden: id, naam, continent, centroid |
| `territories.geo.json` | Polygon-geometrie per gebied (frontend-render + klik-detectie) |
| `adjacency_validated.json` | 84 grenzen (`from`, `to`, `type: land\|sea`) — de aangrenzingsgraaf |
| `continents.json` | Continentbonussen |
| `colors.json` | 7 spelerskleuren + kleurenblind-symbolen |
| `cards.json` | Deck (45 kaarten), set-regels, inleg-thema's, `ownedTerritoryBonus` |
| rollen / missies / events | JSON, nog te vullen (FO §13) — datamodel staat, content later |

De engine bevat **geen** kaart-, kleur- of kaartkennis in code; alles komt uit deze bestanden. Dat is de kern van "data-driven" uit het FO: een nieuwe kaart of extra gebied = andere data, geen codewijziging.

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

### 5.3 Timer-afhandeling

De beurttimer (FO §5.4) is **server-side gezaghebbend**: de server houdt de `timerDeadline` bij en handhaaft de timeout, zodat een client die zijn tabblad sluit de beurt niet kan ophangen. De timer pauzeert server-side bij `DeclareAttack` en hervat na volledige gevechtsafhandeling. Clients tonen een afteller die met de server gesynchroniseerd wordt, maar de client-klok is puur cosmetisch.

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

**Cruciaal (uit de kaart-look-iteraties):** de SVG-gebiedenlaag moet exact **dezelfde projectie** gebruiken als waarmee `map-background-final.png` is gegenereerd — het v4-silhouet met lengtegraadbereik **−180° tot 191°** (i.p.v. de standaard −180°/180°), nodig om Kamchatka's oostpunt aaneengesloten te houden. Wijkt de overlay-projectie hiervan af, dan schuiven de klikbare gebieden en de achtergrond uit elkaar. De projectieformule staat in `build_silhouette_v4.py` en moet 1-op-1 in de frontend worden overgenomen.

Bekende, geaccepteerde cosmetische afwijkingen tussen achtergrond en overlay: Indonesië/Filipijnen en een lichte schim langs de onderrand. De klik-detectie blijft correct (die volgt de geodata); alleen valt de geschilderde kust daar niet exact samen met het klikvlak.

### 7.3 Gebiedsselectie

Conform FO §2.3: de telefoon toont **nooit** een kaart om op te tikken, altijd een knoppenlijst van geldige opties. De TV highlight de corresponderende gebieden in de SVG-laag. Beide lijsten komen van dezelfde server-berekende set geldige opties.

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

## 10. Openstaande technische beslissingen

Deze staan bewust nog open en horen bij de uitwerking, niet bij dit ontwerp:

1. **Marten-projectie: inline vs. async.** Inline is eenvoudiger en voor één-huiskamer-schaal ruim voldoende; async schaalt beter maar is hier waarschijnlijk overkill. Voorstel: begin inline.
2. **Delta- vs. full-state-push.** Full-state is simpeler en voor 43 gebieden + ≤7 spelers klein genoeg om elke keer volledig te pushen. Voorstel: begin met full-state, optimaliseer naar delta's alleen als het nodig blijkt.
3. **Timer-synchronisatie-precisie.** Hoe strak moeten client- en serverklok lopen? Voor een informeel spel volstaat "server handhaaft, client toont benadering".
4. **Rollen/missies/events-content** — datamodel staat (FO §8/§9/§6.1), inhoud nog te vullen; dat is contentwerk, geen architectuur.
5. ~~**44- vs. 42-gebieden** (Nieuw-Zeeland/Chili)~~ **Besloten: 43 gebieden.** Alleen Nieuw-Zeeland is toegevoegd (continent Australië); Chili blijft onderdeel van `peru`. Verwerkt in de data: 84 grenzen (twee nieuwe zeeroutes, zie FO §4.2), continentbonus Australië van 2 naar 3, en een 43e territoriumkaart met `symbol-1` (deck 45). `territories_extended.*` blijft ongewijzigd als uitbreidbaarheidsbewijs en is géén speeldata.

---

## 11. Aanbevolen bouwvolgorde (uit `project-overzicht-risk.md`, hier technisch geduid)

1. **Rules engine** (pure C#-library + unit tests) — geen transport, geen persistentie. Fundament.
2. **Event sourcing eromheen** (Marten): commando's → events → projectie, met round-trip-test.
3. **Minimal API + SignalR-hub**: commando's ontvangen, state pushen, groepen/privacy.
4. **Frontend met placeholder-kaart** (rechthoeken): volledige flow end-to-end werkend.
5. **Echte kaartlaag**: `map-background-final.png` + SVG-overlay met de v4-projectie.
6. **Reconnect & randgevallen**: expliciet vanaf het begin meenemen, hier hardmaken.

