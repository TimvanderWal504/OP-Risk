# Project-overzicht — Digitaal Risk

**Doel van dit document:** één plek die samenvat wat er tot nu toe is uitgewerkt en gebouwd, en wat er nog moet gebeuren.

---

## 1. Wat er klaar is

### 1.1 Ontwerp & speeldata

- **Functioneel ontwerp** (`functioneel-ontwerp-risk.md`) staat vast: host-op-TV + spelers-op-telefoon, gebiedsselectie via hybride highlight+knoppenlijst, aanval/verdediging met zelf te kiezen dobbelstenen, harde beurttimer die pauzeert tijdens een gevecht, moderne fortify-regel, klassieke kaartenset-waardering, 7 spelers met 18 startlegers, geheime missies + werelddominantie als winconditie, en het kaart-datamodel (§4). Rollen, missies en gebeurteniskaarten zijn inmiddels ook **inhoudelijk ingevuld** (zie §1.4).
- **Design** (`claude-design-prompts-risk.md`) is uitgevoerd in Claude Design; de TV- en telefoonschermen in `frontend/src/components/` volgen dat ontwerp (incl. een "pitch/silver"-restyle op basis van een bijgewerkte Host-scherm-export).
- **Hosting-plan** (`plan-b-reisopstelling.md`): backend thuis op Proxmox via Tailscale Funnel, laptop als TV-scherm. Nog niet in praktijk uitgevoerd/getest, zie §2.

### 1.2 `RiskGame.Rules` — pure rules engine ✅ gebouwd

`src/RiskGame.Rules/` bevat de volledige pure C#-implementatie, zonder ASP.NET/SignalR/Marten/I/O-afhankelijkheden: state (`GameState`, `TurnState`, `PhaseTimer`, `TerritoryOwnership`, `Player`), kaartdomein (`MapDefinition`, `MapDefinitionParser`, `AdjacencyGraph`, `Territory`, `Continent`, `Card`, `CardDeckBuilder`), gevechtslogica (`CombatResolver`, `AttackGuards`, `ConquestResolution`), fortify (`FortifyGuards`), versterken/kaarten (`ReinforcementCalculator`, `CardTradeCalculator`, `CardSetEvaluator`), missies (`IMission`, `MissionAssignmentCalculator`, `WinConditionEvaluator`), rollen (`RoleAssignmentCalculator`, `RoleDefinition`, `RoleEffects`), gebeurtenis-effecten (`IEffect`, `ActiveEffect`, `ArmyAttritionCalculator`, `EventDefinition`) en beurtverloop (`OrderRollCalculator`, `SetupTurnCalculator`, `TurnOrderCalculator`, `TurnPhaseTransitions`, `PhaseTimerFactory`). Elk van deze onderdelen dekt het bijbehorende FO-hoofdstuk (versterken/aanvallen/verplaatsen §5, missies §6, rollen §8, gebeurtenisronde §9, timer §5.4).

`RiskGame.Rules.Tests` bevat 34 testbestanden met circa 575 test-cases, inclusief kaart-specifieke dekking (`Standaard43Tests`/`Standaard43Data`), geo/adjacency-pariteit (`GeoPariteitTests`, `KaartDekkingTests`), winconditie- en roleffect-tests en per-guard testbestanden.

### 1.3 `RiskGame.Api` + `RiskGame.Persistence` — API, SignalR en event sourcing ✅ gebouwd

`src/RiskGame.Api/` bevat Minimal API-endpoints (`GameEndpoints`, `HubEndpoints`), een SignalR-hub (`GameHub`, `IGameClient`, foutafhandeling via `HubErrorSerializer`/`HubExceptionLoggingFilter`), commandohandlers per fase (Lobby, OrderRoll, Setup, Reinforce, Attack, TurnFlow), DTO's + mapper, en een hosted `TurnTimerBackgroundService` die de serverzijdige beurttimer verzorgt (FO §5.4/TO §5.3) — inclusief regressietests met een `FakeTimeProvider`.

`src/RiskGame.Persistence/` (nieuw t.o.v. het oorspronkelijke ontwerp als apart project) bevat de Marten-integratie: 27 event-klassen (`GameCreated`, `TerritoryClaimed`, `AttackDeclared`, `CombatResolved`, `TerritoryConquered`, `CardsTraded`, `MissionAssigned`, `RoleAssigned`, `PhaseChanged`, `TurnEnded`, e.a.), `Projections/GameProjection`, JSON-converters en `Store/GameStoreFactory`. Getest via `RiskGame.Api.Tests` (incl. `PostgresFixture` voor hub-integratietests) en `RiskGame.Persistence.Tests` (`GameProjectionRoundTripTests`, round-trip event → projectie).

Dit dekt bouwstappen 1 en 2 uit §3 volledig, en het grootste deel van stap 3.

### 1.4 Speeldata — inclusief rollen, missies en gebeurtenissen ✅ ingevuld

Speeldata is gereorganiseerd naar `data/maps/{mapId}/`, met **`standaard-43`** als eerste (en tot nu toe enige) kaartvariant: `territories.json`, `territories.geo.json`, `adjacency_validated.json`, `continents.json`, `cards.json`, `map-background-final.png`. `colors.json` staat, zoals in TO §3.2 vastgelegd, gedeeld op `data/colors.json` (buiten de map-varianten om, want kleuren zijn niet kaart-specifiek).

Anders dan in eerdere versies van dit overzicht is de content voor rollen, missies en gebeurtenissen **niet meer leeg**:
- `roles.json` — 15 rollen (ruim boven het maximum van 7 spelers), elk met een uniek herkomstland en effect-type conform FO §8.
- `missions.json` — missieset dekkend voor 7 kleuren: per kleur een `EliminatePlayer`-missie plus `ConquerContinents`/`TerritoryCount(MinArmies)`-missies die tevens als fallback dienen.
- `events.json` — gebeurtenisronde-content conform FO §9.2, inclusief de nieuwe effect-types `TerritoryLocked` en `ArmyAttrition` (het oorspronkelijk voorgestelde `RevoltOnSingleArmy` is geschrapt).

Dit was in de bouwvolgorde (§3) bewust als "kan na de eerste bouwfases" gemarkeerd, en is nu al gedaan.

### 1.5 Frontend — schermen, i18n en motion; kaartlaag nog niet gestart

`frontend/src/components/` bevat 12 schermcomponenten plus 15 UI-primitieven onder `components/ui/`, elk met een colokerende test. `frontend/src/routes/` bevat `phone/HomePage`, `phone/PhonePage` en `tv/TvPage`. `hooks/` bevat `useSignalR`, `useGameState`, `GameHubProvider`/`GameHubContext`, `useHeldPhase` en `useTvGame`. Vertalingen lopen via een key-first i18n-opzet (`i18n/`, `locales/` met 14 namespaces) conform TO §7.4.

Recente ontwikkeling focust op de lobby- en order-roll-schermen (host-opzet, joinen, kleur-/rolkeuze, dobbelen om de beurtvolgorde) en op een visuele restyle van de TV-motion op basis van een bijgewerkte design-export ("pitch/silver-restyle", zie de laatste commits). Dit is stap 4 uit §3, nog in uitvoering: het gaat om de lobby/setup-flow, niet om een speelbaar bord.

**`frontend/src/map/` bevat nog alleen een `.gitkeep`.** Er is nog geen placeholder-kaart en geen SVG-kaartlaag gebouwd — stap 4 (volledige flow, ook met placeholder-rechthoeken) en stap 5 (echte kaartlaag) uit §3 zijn dus nog niet gestart voor het speelbord zelf.

---

## 2. Wat er nog moet gebeuren

Op volgorde van "blokkerend voor de kern" naar "kan later":

### 2.1 Speelbord in de frontend (blokkerend voor een speelbare demo)
Nog te bouwen: het bord zelf (placeholder of echt) voor de fases na de lobby/order-roll — versterken, aanvallen, verplaatsen, kaarteninleg, gebeurtenisronde, missie-onthulling. Dit is het ontbrekende stuk van stap 4 uit §3.

### 2.2 Echte kaartlaag (SVG-overlay + achtergrond)
Zodra het bord er is: `map-background-final.png` (aanwezig in `data/maps/standaard-43/`) als achtergrond met `territories.geo.json` als klikbare/kleurbare SVG-laag erboven, met dezelfde projectie (lengtegraadbereik −180° tot 191°, zie TO §7.2). Dit is stap 5 uit §3 en volledig nog te doen — er bestaat nog geen `map/`-code.

### 2.3 Hosting-plan in de praktijk beproeven
`plan-b-reisopstelling.md` is uitgewerkt maar nog niet als daadwerkelijke deploy-/testronde doorlopen (Tailscale Funnel permanent vs. sessie-gebonden aanzetten, UPS-status Proxmox-host — zie het document §4/§5).

### 2.4 Reconnect & randgevallen hardmaken in de UI
De serverzijde (sessietoken, reconnect via SignalR, auto-pass) staat in de rules/API-laag; of dit end-to-end via de frontend werkt (ander apparaat, tabblad sluiten tijdens iemands beurt) is nog niet apart geverifieerd. Dit is stap 6 uit §3.

---

## 3. Bouwvolgorde (TO §11) — status

1. **Rules engine als pure C#-library, met unit tests** — ✅ gedaan (§1.2).
2. **Event sourcing (Marten) eromheen** — ✅ gedaan (§1.3, `RiskGame.Persistence`).
3. **Minimal API + SignalR eromheen** — ✅ gedaan (§1.3); lobby/commando's/events werken.
4. **Frontend met placeholder-kaart** — 🔶 gedeeltelijk: lobby/joinen/kleurkeuze/order-roll staan, het speelbord (ook als placeholder) nog niet (§2.1).
5. **Echte kaart + visuele polish** — ⬜ nog niet gestart (§2.2).
6. **Reconnect-afhandeling** — 🔶 serverzijde aanwezig, end-to-end frontend-verificatie nog te doen (§2.4).

---

## 4. Bestandenoverzicht

| Bestand/map | Inhoud |
|---|---|
| `docs/functioneel-ontwerp-risk.md` | Volledig functioneel ontwerp, alle spelregels + datamodellen |
| `docs/technisch-ontwerp-risk.md` | Technisch ontwerp: architectuur, stack, event sourcing, teststrategie |
| `docs/claude-design-prompts-risk.md` | 3 design-prompts (TV, host-opzet, telefoon) — uitgevoerd |
| `docs/plan-b-reisopstelling.md` | Hosting-plan: Tailscale Funnel + laptop-als-TV — nog te beproeven |
| `data/colors.json` | De 7 spelerskleuren, gedeeld over alle kaartvarianten |
| `data/maps/standaard-43/territories.json` | 43 gebieden → atomaire regio's (groeperingsconfiguratie) |
| `data/maps/standaard-43/territories.geo.json` | Diezelfde 43 gebieden met echte polygon-geometrie |
| `data/maps/standaard-43/adjacency_validated.json` | Gevalideerde land/zee-grenzen (84), consistent met de geometrie |
| `data/maps/standaard-43/continents.json` | Continentbonussen (klassiek, AU 3) |
| `data/maps/standaard-43/cards.json` | Territoriumkaarten-deckregels, twee thema's |
| `data/maps/standaard-43/roles.json` | 15 ingevulde rollen (FO §8) |
| `data/maps/standaard-43/missions.json` | Missieset dekkend voor 7 kleuren (FO §6.1) |
| `data/maps/standaard-43/events.json` | Gebeurtenisronde-content (FO §9.2) |
| `data/maps/standaard-43/map-background-final.png` | Kaart-achtergrondafbeelding voor de TV |
| `files/build_map.py` | Script dat de kaart uit Natural Earth-data (her)genereert |
| `src/RiskGame.Rules/` | Pure C# rules engine (§1.2) |
| `src/RiskGame.Rules.Tests/` | Unit tests op de rules engine |
| `src/RiskGame.Persistence/` | Marten-events + projectie (event sourcing, §1.3) |
| `src/RiskGame.Persistence.Tests/` | Round-trip tests event → projectie |
| `src/RiskGame.Api/` | Minimal API + SignalR-hub + timer-service (§1.3) |
| `src/RiskGame.Api.Tests/` | Integratietests op de API/hub |
| `frontend/src/components/` | Schermcomponenten + UI-primitieven, gebaseerd op `DESIGN.md` |
| `frontend/src/routes/` | `phone/HomePage`, `phone/PhonePage`, `tv/TvPage` |
| `frontend/src/hooks/` | `useSignalR`, `useGameState`, `GameHubProvider`, `useHeldPhase`, `useTvGame` |
| `frontend/src/i18n/`, `frontend/src/locales/` | Key-first i18n-opzet, 14 namespaces (nl/en) |
| `frontend/src/map/` | Nog leeg (alleen `.gitkeep`) — kaartlaag nog te bouwen |

---

## 5. Belangrijkste les uit dit traject

De kaart-vorm en de kaart-look zijn bewust twee losse dingen gebleven: de geodata (`territories.geo.json`, `adjacency_validated.json`) staat vast en is onafhankelijk van de uiteindelijke visuele stijl. Diezelfde scheiding is nu ook zichtbaar in de bouwvolgorde: de volledige spellogica (rules engine, event sourcing, API/SignalR) en zelfs de content (rollen, missies, events) zijn al klaar en getest, terwijl de visuele kaartlaag in de frontend nog moet beginnen. Dat is geen achterstand die iets anders blokkeert — de architectuur is er expliciet op ingericht (TO §7.2/§7.3) dat de kaartlaag als laatste, op zichzelf staande stap volgt.
