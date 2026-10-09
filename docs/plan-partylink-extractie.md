<!-- Werkplan, geen changelog: git-commits blijven de enige wijzigingslog (CLAUDE.md). -->
<!-- Oorsprong: onderzoekssessie 2026-10-06 op main (na merge van feat/kaart-wereld-49 en RejoinAsPlayer); herzien na twee elite-code-reviews dezelfde dag, met beslissingen B1–B17 van de gebruiker. Status: VASTGESTELD. -->

# Plan: TV↔telefoon-laag loskoppelen van Risk ("PartyLink")

> **Naam.** "PartyLink" is de definitieve project-, namespace- en packagenaam (B9):
> `PartyLink.Server` op NuGet en `@partylink/partylink-react` op npm, onder een eigen
> npm-organisatie (B10).

## 1. Doel

De generieke basis van RiskOP — een **TV/host-scherm** dat via een QR aan een **kamer** wordt
gekoppeld, **telefoons** die als speler joinen, herverbinden en hun plek overnemen, en een
server die state met **per-publiek privacy** pusht — losmaken van de Risk-implementatie, zodat:

1. die laag in een **eigen GitHub-repository** kan leven;
2. andere mensen hem kunnen gebruiken voor hun eigen TV+telefoon-spellen/-apps;
3. ik hem zelf hergebruik voor volgende applicaties;
4. RiskOP er daarna gewoon één (de eerste) consument van is — zonder functioneel verschil.

**Niet-doelen.** Geen wijziging van spelregels (FO), geen visuele wijziging (DESIGN.md), geen
nieuwe features in Risk, geen ondersteuning voor meerdere serverinstanties (B3). Elke fase
eindigt met dezelfde werking als ervoor.

## 2. Beslissingen

| # | Beslissing | Gevolg |
| --- | --- | --- |
| **B1** | Het package ondersteunt **beide** modi voor sessie-identiteit: (a) de app beheert spelers en tokens zelf, het package valideert alleen; (b) het package beheert spelers en tokens zelf, zodat een app zonder eigen database direct werkt. | Eén contract `ISeatAuthority` met twee implementaties-soorten: app-eigen (Risk, Marten) en de ingebouwde `InMemoryRoomStore` (B13). Zie §3.3. |
| **B2** | **Geen envelope op de draad.** Het package is zo generiek mogelijk: de state gaat kaal over de lijn, en Risk stuurt dus gewoon zijn `GameStateDto`. Het enige dat package en app-state verbindt, zijn extension methods waarmee de app de vorm van zijn state registreert. | `IRoomStateShape<TState>` (kamer-id, versie, versie zetten, spelers), geregistreerd via extension methods; aan de frontend-kant dezelfde accessors als opties. Zie §3.4. |
| **B3** | **Eén serverinstantie** is voor nu voldoende. Schaalbaarheid over meerdere nodes is een mogelijke vervolgkeuze. | Registries blijven in-memory; de beperking wordt expliciet gedocumenteerd (README + protocoldocument). Geen abstractie vooraf. |
| **B4** | **Wire-namen direct omzetten** naar de generieke namen (route A). Geen wrappers met de oude namen. | Stap 1.5 hernoemt client, server en `Api.Tests` samen; zie §5. |
| **B5** | **Eigen fouttype in het package.** `RiskGame.Rules` blijft onafhankelijk; Risk mapt één-op-één. | `PartyLinkError` (code + parameters) in het package; Risk mapt `ValidationError` ernaartoe aan de hub-grens. Zie §3.2. |
| **B6** | **Distributie: packages + sample als template.** NuGet (nuget.org) en npm; de sample-app uit fase 2 is tegelijk de template-repo. | Fase 3 publiceert packages; de sample wordt als GitHub-template gemarkeerd. |
| **B7** | **Frontend-package is headless.** Geen styling en geen componenten; een ongestylede basis-UI bestaat alleen in de sample. | §3.6. |
| **B8** | **Licentie MIT.** | `LICENSE` in de nieuwe repo; `license`-velden in `.csproj` en `package.json`. |
| **B9** | **Naam: PartyLink.** | Namespaces `PartyLink.*`, packages `PartyLink.Server` en `partylink-react`. |
| **B10** | **npm-scope: een eigen organisatie** (`@partylink`). | De npm-organisatie aanmaken vóór de eerste publicatie (fase 3); beschikbaarheid van de naam dan controleren. Lukt `@partylink` niet, dan wordt de scope opnieuw voorgelegd. |
| **B11** | **Repo eerst privé**, openbaar zodra fase 2 klaar is en de lekcheck is gedaan. | Fase 3 begint privé; openbaar maken is een aparte, laatste stap. |
| **B12** | **Groepsprefix configureerbaar.** Standaard `room`; Risk configureert `game`. | Optie `GroupPrefix` in `AddPartyLink`; §3.2. Groepsnamen zijn intern (niet op de draad); de suffixen worden wel generiek (`-display` i.p.v. `-tv`), dus TO §6.1 verandert hoe dan ook. |
| **B13** | **Modus (b) levert ook de state-opslag en het aanmaken van kamers.** Eén bron van waarheid per kamer. | `InMemoryRoomStore<TState>` met `CreateRoom`/`JoinRoom` in het package; de app levert alleen pure functies op de state. Zie §3.3. |
| **B14** | **Deployen mag op elk moment, en de database mag leeg.** Geen compatibiliteitsperiode en geen datamigratie nodig bij de overstap. | Na stap 1.5 (wire-namen) wordt gewoon gedeployed; open TV's en telefoons moeten één keer verversen. Bestaande spellen en `PlayerSessionToken`-documenten hoeven niet mee. Dit is een toestemming voor de overstap in dit plan, geen standaardwerkwijze. |
| **B15** | **De code is openbaar zodra er een package gepubliceerd is.** | De lekcheck gaat vóór de eerste publicatie (fase 3, stap 2). B11 (privé repo) beschermt daarna alleen nog historie en issues. |
| **B16** | **Het package is Engels** (code, doc-comments, logberichten, tests, README); RiskOP blijft Nederlands. | Verplaatste bestanden worden bij de verhuizing vertaald; de Risk-specifieke uitleg die daarbij uit een package-bestand verdwijnt, komt bij de aanroeper in Risk te staan. |
| **B17** | **Kamer- en koppelcodes uit een cryptografisch veilige bron** (`RandomNumberGenerator`) i.p.v. `Random.Shared`. | Meegenomen in stap 1.1 als aparte `fix:`-commit na de pure verplaatsing. |

## 3. Doelarchitectuur

### 3.1 Begrippen (generieke terminologie)

| PartyLink | Risk | Toelichting |
| --- | --- | --- |
| Room / `roomId` | Game / `gameId` | de 6-tekencode |
| Display | TV | scherm zonder bediening, alleen meekijken |
| Player / `playerId` | speler | bewezen identiteit via sessietoken |
| Seat authority | Lobby + sessietokens | wie mag welke speler zijn |
| Pairing code | koppelcode | eenmalige code die de display als QR toont |
| Reclaim seat | `RejoinAsPlayer` | plek overnemen zonder token |
| Release seat | `RemovePlayer` (verbindingsdeel) | speler verlaat de kamer |

In RiskOP blijft de Risk-terminologie (src/CLAUDE.md: namen volgen FO/TO); alleen de
package-API gebruikt de generieke termen.

### 3.2 Backend — NuGet-package `PartyLink.Server`

Geen afhankelijkheid van Marten, `RiskGame.*`, Azure of een database. Wel van ASP.NET Core
SignalR.

**Basis-hub.** `abstract class RoomHub<TClient, TState> : Hub<TClient> where TClient : class, IRoomClient<TState>`.
`TState` is de **wire-state** (bij Risk `GameStateDto`); het domeinmodel komt nooit in het
package. Eén hub, geen tweede: anders heeft elke client twee verbindingen nodig. Levert:

- `RegisterDisplay()` → koppelcode
- `SendRoomToDisplay(pairingCode, roomId)` → kamer eerst checken, dán code innemen
- `WatchRoom(roomId)` → groepen `all` + `display`, geredacte state
- `RejoinRoom(roomId, playerId, sessionToken)` → speler moet in `Players(state)` staan (anders
  `partylink.unknownPlayer`), token valideren via `ISeatAuthority`, inclusief
  de **dubbele tokencheck** tegen een gelijktijdige overname, en degraderen naar de
  display-weergave zonder fout
- `ReclaimSeat(roomId, claim)` → `ISeatAuthority.ReclaimAsync` (atomair, §3.3), antwoord
  `SeatResponse<TState>`; daarna de
  verbindingschoreografie: nieuwe connectie eerst registreren, dán eerdere connecties uit
  player-groep en presence, groep van een eerdere speler op deze connectie verlaten
- `OnDisconnectedAsync` → pairing + presence opruimen
- protected helpers voor de afgeleide hub:
  - `AdmitPlayerAsync(roomId, admittedSeat)` — ná een domein-join die zelf het token al heeft
    uitgegeven: groepen, presence, eerdere speler op deze connectie loslaten, uit de
    display-groep. **Geeft geen token uit** (§3.3).
  - `ReleaseSeatAsync(roomId, playerId, finalState)` — laatste push naar de vertrekkende speler
    (die staat niet meer in `Players(state)`), spelergroep leegmaken, presence vergeten.
    Vervangt de gerichte push in Risk's `RemovePlayer` ([GameHub.cs](../src/RiskGame.Api/Hubs/GameHub.cs)).
  - `BroadcastAsync(roomId, state)` — de huidige `UnwrapAndBroadcastAsync`: versie zetten via
    de state-shape, eerst display, dan elke speler.
- virtuele haak `OnPlayerReturnedAsync(roomId, playerId)` → Risk heft hier auto-pass op.

`GameHub` in RiskOP erft hiervan en voegt alleen de Risk-commando's toe.

**Abstracties die de app levert:**

| Interface | Verantwoordelijkheid | Risk-implementatie |
| --- | --- | --- |
| `IRoomStateShape<TState>` | `RoomId(state)`, `Version(state)`, `WithVersion(state, v)`, `Players(state)` | `GameStateShape` over `GameStateDto` (§3.4) |
| `IRoomStateSource<TState>` | bestaat de kamer, huidige wire-state (ongeredacteerd) + versie | Marten: `GameState` → `GameStateDto` + stream-versie + `OrderRollProgressReader` |
| `IStateRedactor<TState>` | `ForDisplay(state)`, `ForPlayer(state, playerId)` — alleen op de wire-state | `GameStateDtoMapper.RedactForTv`/`RedactForPlayer` (incl. de `Finished`-uitzondering van TO §6.1) |
| `ISeatAuthority` | sessie-identiteit (§3.3) | `MartenSeatAuthority` onder `GameWriteLock` |
| `IPresenceListener` | callback als een speler langer dan de grace period weg is; mag "vergeet deze kamer" teruggeven | huidige `HostAbsenceMonitor`-logica + `AutoPassCommandHandler` |
| `IClientKeyResolver` (optioneel) | sleutel voor de rate limit; standaard `RemoteIpAddress` | Azure-variant die `X-Forwarded-For` gebruikt (§3.5) |

**Registratie (extension methods):**

```csharp
builder.Services.AddPartyLink<GameStateDto>(options =>
{
    options.AbsenceGracePeriod = TimeSpan.FromMinutes(2);          // FO §11.1
    options.GroupPrefix = "game";                                  // B12; standaard "room"
})
.UseStateShape<GameStateShape>()
.UseStateSource<MartenGameStateSource>()
.UseRedactor<GameStateRedactor>()
.UseSeatAuthority<MartenSeatAuthority>()       // modus (a); modus (b): .UseInMemoryRooms<T>(...)
.UsePresenceListener<HostAbsenceListener>()
.UseClientKeyResolver<ForwardedForClientKeyResolver>();

app.MapPartyLinkHub<GameHub>("/hubs/game");
```

**Eigen foutcodes.** Het package geeft nooit Risk-codes terug, maar eigen codes in een eigen
namespace: `partylink.unknownRoom`, `partylink.unknownPairingCode`, `partylink.unknownPlayer`,
`partylink.rateLimited`, `partylink.missingArgument`. Ze staan in het wire-contract (§5); Risk
vertaalt ze in zijn eigen i18n.

**Antwoordtypes.** `SeatResponse<TState>(string PlayerId, TState State, string SessionToken)` —
zelfde veldnamen als het huidige `JoinGameResponse`, zodat de frontend (`adopt`) niet verandert.
Risk's `JoinGame` geeft hetzelfde type terug.

**Foutformaat.** Fouten zijn codes + parameters, geserialiseerd in de `HubException`. Het
package vertaalt nooit; elke app doet dat zelf (Risk: i18n). Het package heeft een **eigen
fouttype** (B5): `PartyLinkError(string Code, IReadOnlyDictionary<string, string>? Params)`
(veldnaam `Params`, want op de draad staat `params`)
met `PartyLinkErrorSerializer` en `RoomHubException.From(errors)`. Het geserialiseerde formaat
is gelijk aan het huidige (`HubErrorSerializer`), zodat `parseHubError` in de frontend niet
verandert. Risk mapt `ValidationError` → `PartyLinkError` op één plek (extension
`ToPartyLinkErrors()`), en `RiskGame.Rules` krijgt geen afhankelijkheid op het package.

**Wat níet in het package hoort:** autorisatie van domeincommando's. Het sessietoken blijft
een **rejoin-bewijs** (TO §6.3, bewuste beperking 1); `IsConnectionOf` is wel beschikbaar voor
apps die een commando aan de verbinding willen toetsen (zoals Risk bij `SetAutoPass`).

### 3.3 Sessie-identiteit: `ISeatAuthority` (B1)

**Uitgangspunt:** tokenuitgifte en spelerkeuze moeten **atomair met het domein** gebeuren. Nu
zit dat ook zo in Risk:

- joinen: `PlayerJoined` en `PlayerSessionToken` in één `SaveChangesAsync`
  ([LobbyCommandHandler.cs](../src/RiskGame.Api/Commands/LobbyCommandHandler.cs));
- overnemen: naam opzoeken én token vervangen onder `GameWriteLock`
  ([PlayerSessionCommandHandler.cs](../src/RiskGame.Api/Commands/PlayerSessionCommandHandler.cs)).

Opsplitsen in losse "zoek speler" + "roteer token"-aanroepen zou een race openen (een
`RemovePlayer` of tweede overname ertussen → geldig token voor een verwijderde speler, of twee
tabbladen die allebei denken te winnen). Daarom één contract:

```csharp
public interface ISeatAuthority
{
    /// Atomair: speler kiezen + nieuw token vastleggen + oud token ongeldig. Laatste schrijver wint.
    Task<SeatResult> ReclaimAsync(string roomId, string claim);
    Task<bool> IsCurrentTokenAsync(string roomId, string playerId, string sessionToken);
}

public sealed record AdmittedSeat(string PlayerId, string SessionToken);

/// Óf een toegelaten plek, óf de redenen waarom niet (bv. partylink.unknownRoom of een app-eigen
/// code zoals Risk's common.ambiguousPlayerName).
public sealed record SeatResult(AdmittedSeat? Seat, IReadOnlyList<PartyLinkError> Errors);
```

Het package biedt `SessionTokens.New()` als helper voor tokengeneratie en
`SessionTokens.Matches(expected, actual)` voor de vergelijking in constante tijd.

**Modus (a) — de app beheert (Risk).** De app implementeert `ISeatAuthority` binnen haar eigen
transactiegrens. De domein-join (`JoinGame`) blijft in de app, maakt het token zelf aan in
dezelfde transactie als het join-event, en geeft het resultaat als `AdmittedSeat` aan
`AdmitPlayerAsync`. Het package geeft in deze modus **nooit** zelf een token uit.

**Modus (b) — het package beheert alles (B13).** Voor apps zonder eigen database (de sample
uit Fase 2, prototypes). Het package levert `InMemoryRoomStore<TState>`, dat per kamer **state,
spelers en tokens samen** bijhoudt onder één lock per kamer. Daarmee is er één bron van waarheid:
de push en `RejoinRoom` lopen gewoon over `Players(state)`, net als in modus (a).

De app levert alleen pure functies op haar eigen state:

```csharp
.UseInMemoryRooms<QuizState>(rooms =>
{
    rooms.Create = roomId => new QuizState(roomId, Players: [], Version: 0);
    rooms.AddPlayer = (state, playerId, displayName) => state with { Players = [.. state.Players, new(playerId, displayName)] };
    rooms.RemovePlayer = (state, playerId) => state with { Players = [.. state.Players.Where(p => p.Id != playerId)] };
});
```

`InMemoryRoomStore` implementeert zelf `IRoomStateSource`, `ISeatAuthority` en een
`Update(roomId, Func<TState, TState>)` voor app-commando's (versie ophogen gebeurt daar). De hub
krijgt in deze modus kant-en-klare `CreateRoom()` en `JoinRoom(roomId, displayName)`: speler
toevoegen, token uitgeven, versie ophogen en `AdmitPlayerAsync` in één lock. Dezelfde
contracteisen als modus (a): atomair, laatste schrijver wint, oud token direct ongeldig.
In-memory betekent: weg na een herstart (consistent met B3).

**Claim is ondoorzichtig.** Wat een `claim` is, bepaalt de authority. Risk gebruikt een naam
(TO §6.3, bewuste beperking 2: wie de spelcode en een naam kent, neemt die speler over).
`InMemoryRoomStore` gebruikt standaard een **herstelcode** die bij het joinen aan de speler
wordt getoond — zodat het onveilige naam-model niet de standaard voor andere apps wordt. Het
protocoldocument beschrijft het beveiligingsmodel van beide als expliciete keuze van de app.

### 3.4 State-vorm zonder envelope (B2)

De draad draagt **de kale state van de app** — bij Risk precies de huidige `GameStateDto`, ook
in het event `RoomStateUpdated`. Het package wikkelt niets in. Wat het package van die state
moet weten, registreert de app via extension methods:

```csharp
public sealed class GameStateShape : IRoomStateShape<GameStateDto>
{
    public string RoomId(GameStateDto state) => state.GameId;
    public int Version(GameStateDto state) => state.StateVersion;
    public GameStateDto WithVersion(GameStateDto state, int version) => state with { StateVersion = version };
    public IEnumerable<string> Players(GameStateDto state) => state.Players.Select(player => player.Id);
}
```

Voor eenvoudige gevallen een delegate-overload, zodat een sample geen klasse hoeft te schrijven:

```csharp
.UseStateShape<GameStateDto>(
    roomId: s => s.GameId,
    version: s => s.StateVersion,
    withVersion: (s, v) => s with { StateVersion = v },
    players: s => s.Players.Select(p => p.Id));
```

**Frontend, zelfde idee:** de app geeft de accessors één keer mee aan de provider; elke hook
leest ze daar.

```ts
<PartyLinkProvider
  hubUrl={apiUrl('/hubs/game')}
  stateShape={{ roomIdOf: (s: GameStateDto) => s.gameId, versionOf: (s) => s.stateVersion }}
>
```

Daarmee blijven de huidige client-checks (`updated.gameId !== gameId`, de stale-guard op
`stateVersion`) generiek zonder dat de wire-vorm van Risk verandert.

### 3.5 Hosting en rate limiting

- **Forwarded headers horen niet in het package.** Risk's `Program.cs` vertrouwt elke proxy;
  dat is alleen veilig omdat de container achter Azure App Service geen publiek IP heeft. Als
  generieke standaard zou elke client `X-Forwarded-For` kunnen vervalsen en de rate limit
  omzeilen. Het package kent alleen `IClientKeyResolver` (standaard `RemoteIpAddress`); Risk
  houdt de forwarded-headers-configuratie in eigen `Program.cs`.
- **Rate limit via attribuut, niet via methodenamen.** `[RateLimitedEntry("common.tooManyJoinAttempts")]`
  op de hub-methode; het filter leest het via `HubInvocationContext.HubMethod`. Hernoemen kan de
  limiet dan niet stilzwijgend uitschakelen (nu is het `nameof(GameHub.X)`; met strings in
  configuratie zou die compile-time-binding verdwijnen). Eigen venster per methode, zoals nu.
- **Raden van kamercodes: misses tellen, niet methodes.** Elke opzoeking die "onbekende kamer"
  (of "onbekende koppelcode") oplevert, telt per client mee in **één centraal venster**,
  ongeacht de ingang. Dat zit op één plek in de lookup van `RoomHub` (`IRoomLookupGuard`) en vangt
  zo `WatchRoom`, `RejoinRoom`, `JoinRoom`, `ReclaimSeat`, `SendRoomToDisplay` en elke toekomstige
  ingang af. Nu kan dat niet: `WatchGame`, `RejoinGame`, `GetActionLog` en
  `GET /games/{gameId}/territories` zijn onbegrensd, waardoor de join-limiet uit TO §8 te
  omzeilen is (eerst bestaande codes zoeken via `WatchGame`, dan pas joinen). Risk laat zijn
  REST-endpoint en `GetActionLog` dezelfde guard gebruiken.
- **Het attribuut blijft voor het joinen zelf** (`JoinRoom`/`JoinGame`, `ReclaimSeat`): een
  geldige code mag niet onbeperkt spelers aanmaken of overnames proberen. Een test controleert dat
  elke join- en overname-methode het attribuut draagt.
- **Eén node (B3).** Pairing, presence en rate limit zijn in-memory, en `Clients.Client(id)`
  werkt alleen op dezelfde node. Dit staat als expliciete beperking in README en
  protocoldocument.

### 3.6 Frontend — npm-package `@partylink/partylink-react`

**Headless:** geen styling, geen componenten met eigen vormgeving. DESIGN.md is bindend voor
Risk, en andere apps hebben hun eigen design.

- `PartyLinkProvider({ hubUrl, stateShape })` + `usePartyLink()` — verbinding, `connectionState`,
  start-backoff
- `useDisplayPairing()` — `{ pairingCode, pairedRoomId, failed }`
- `useSendRoomToDisplay()` — `send(pairingCode, roomId)` → `{ ok } | { ok: false, errors }`
- `useRoomState<TState>(roomId)` — alleen meekijken: WatchRoom met retry, `unknownRoom`,
  stale-guard. Voor de display en voor de telefoon vóór het joinen.
- `usePlayerSession<TState>(roomId)` — de speler-kant, en de **enige** hook die rejoin doet:
  playerId/sessionToken in `sessionStorage` (per tab, TO §6.3), RejoinRoom na elke (re)connect,
  `adopt(seatResponse)`, `reclaim(claim)`, state met stale-guard
- `useHubEvent(name, handler)` — voor app-eigen broadcasts (Risk: `DiceRolled`, `HoldsSkipped`
  enz.)
- utilities: `retryDelayMs`, `parseJoinUrl(text, pattern)`, `parseHubError(message)`
- `useQrScanner()` — optioneel sub-entry (`/qr`), zodat `jsqr` geen verplichte dependency is

`react` en `@microsoft/signalr` worden **peer-dependencies**.

**Twee versieregels (zie `reclaimPlayer` op main):**

1. Broadcast of WatchRoom-antwoord: alleen toepassen als de versie **strikt hoger** is.
2. Antwoord op de eigen join/reclaim: ook toepassen bij **gelijke** versie — dat antwoord voegt
   privévelden toe aan dezelfde versie. Zonder deze regel verdwijnen Hand/MissionId (dezelfde
   valkuil als beschreven in het commentaar bij `JoinGame`).

De package-API maakt dit onderscheid expliciet (`applyBroadcast` vs. `applyOwnResponse`), zodat
een consument het niet per ongeluk fout kan doen.

## 4. Inventaris: wat is generiek, wat is Risk

Stand op `main` (2026-10-06).

### 4.1 Backend

| Onderdeel | Waar nu | Generiek deel | Risk-specifiek deel (blijft in RiskOP) |
| --- | --- | --- | --- |
| TV koppelen | [TvPairingRegistry.cs](../src/RiskGame.Api/Services/TvPairingRegistry.cs), `RegisterTv`/`SendGameToTv` | registry volledig; hub-methodes via `IRoomStateSource` | — |
| Kamercode | [GameIdGenerator.cs](../src/RiskGame.Api/GameIdGenerator.cs) | volledig | — |
| Groepsnamen | [GameGroups.cs](../src/RiskGame.Api/Hubs/GameGroups.cs) | volledig | prefix configureerbaar (B12; Risk: `game-`) |
| State-push met privacygrens | [GameStatePush.cs](../src/RiskGame.Api/Hubs/GameStatePush.cs), `UnwrapAndBroadcastAsync` | mechanisme, volgorde, versie zetten via shape | `GameStateDto`, redactieregels |
| Meekijken | `WatchGame` | groepen + geredacte state | state opbouwen (`BuildStateDtoAsync`) |
| Joinen | `JoinGame` + `LobbyCommandHandler` | `AdmitPlayerAsync` (verbindingsdeel) | speler + token aanmaken in één transactie |
| Herverbinden | `RejoinGame`, [PlayerSessionToken.cs](../src/RiskGame.Persistence/Sessions/PlayerSessionToken.cs) | validatie in constante tijd, dubbele tokencheck, degraderen zonder fout | tokenopslag (Marten), auto-pass opheffen |
| Plek overnemen | `RejoinAsPlayer`, [PlayerSessionCommandHandler.cs](../src/RiskGame.Api/Commands/PlayerSessionCommandHandler.cs) | verbindingschoreografie | naam → speler + token roteren onder `GameWriteLock` (= `MartenSeatAuthority`) |
| Speler verwijderen | `RemovePlayer` (gerichte push) | `ReleaseSeatAsync` | het domeincommando |
| Aanwezigheid | [PlayerPresenceRegistry.cs](../src/RiskGame.Api/Services/PlayerPresenceRegistry.cs) | volledig | — |
| Uitval na wachttijd | [HostAbsenceMonitor.cs](../src/RiskGame.Api/Services/HostAbsenceMonitor.cs), `HostAbsenceBackgroundService` | periodieke loop + vergeten | auto-pass, host-overdracht, `CombatNarration` |
| Rate limit | [JoinGameRateLimitFilter.cs](../src/RiskGame.Api/Hubs/JoinGameRateLimitFilter.cs) | miss-guard voor kamercodes, join-attribuut, `IClientKeyResolver` | forwarded-for-resolver; REST-endpoint en `GetActionLog` aan de guard koppelen |
| Hub-filters en foutformaat | `HubErrorSerializer`, `NullArgumentFilter`, `HubExceptionLoggingFilter` | volledig; fouttype wordt `PartyLinkError` (B5) | mapping `ValidationError` → `PartyLinkError` |
| "Verder op TV" | `SkipTvHold`, `HoldsSkipped` | — (presentatieconcept van Risk) | alles; frontend via `useHubEvent` |
| Hosting-plumbing | [Program.cs](../src/RiskGame.Api/Program.cs) | — (§3.5) | CORS, forwarded headers |

### 4.2 Frontend

| Onderdeel | Waar nu | Generiek deel | Risk-specifiek deel |
| --- | --- | --- | --- |
| Verbinding | [GameHubProvider.tsx](../frontend/src/hooks/GameHubProvider.tsx), [useSignalR.ts](../frontend/src/hooks/useSignalR.ts) | volledig | hub-URL, state-shape |
| TV-kant koppelen | [useTvPairing.ts](../frontend/src/hooks/useTvPairing.ts) | volledig | — |
| Telefoon-kant koppelen | [useSendGameToTv.ts](../frontend/src/hooks/useSendGameToTv.ts) | aanroep + resultaat | toast + vertaling |
| TV volgt een kamer | [useTvGame.tsx](../frontend/src/hooks/useTvGame.tsx) | WatchRoom met retry, onbekende kamer, stale-guard | `DiceRolled`, `TerritoryClaimed`, `HoldsSkipped`, combat/event-holds |
| Speler-sessie | [useGameState.tsx](../frontend/src/hooks/useGameState.tsx) | sessionStorage, rejoin na (re)connect, meekijken vóór joinen, reclaim met versieregel 2 | Risk-commando's, catalogus, toasts |
| Retry-backoff | [retryBackoff.ts](../frontend/src/hooks/retryBackoff.ts) | volledig | — |
| Join-URL en QR scannen | [joinUrl.ts](../frontend/src/routes/phone/joinUrl.ts), `useQrScanner` | parsen + scannen | `/play/:gameId` als pad |
| QR tonen, wachtschermen | `QrCodePanel`, `TvShell`, `TvWaitingLayout`, `TvPairPage` | — | **alles** (DESIGN.md) |

## 5. Wire-contract

Hub-methodes en events krijgen generieke namen (B4: direct, zonder wrappers); de **payloads
blijven de kale app-state** (B2). Hernoemen raakt frontend, backend en `Api.Tests` tegelijk.

| Nu | Generiek |
| --- | --- |
| `RegisterTv` | `RegisterDisplay` |
| `SendGameToTv` | `SendRoomToDisplay` |
| `TvPaired` (event) | `DisplayPaired` |
| `WatchGame` | `WatchRoom` |
| `RejoinGame` | `RejoinRoom` |
| `RejoinAsPlayer` | `ReclaimSeat` |
| `GameStateUpdated` (event, payload `GameStateDto`) | `RoomStateUpdated` (payload ongewijzigd `GameStateDto`) |
| `JoinGameResponse` (antwoord) | `SeatResponse<TState>` (zelfde velden) |
| `HoldsSkipped`, `SkipTvHold` | blijven Risk (presentatieconcept) |
| `JoinGame` | blijft Risk (modus a); roept `AdmitPlayerAsync` aan, antwoord `SeatResponse` |

**Foutcodes** die van het package komen, wijzigen ook:

| Nu | Generiek |
| --- | --- |
| `common.unknownGame` (vanuit pairing/watch/rejoin) | `partylink.unknownRoom` |
| `tvPairing.unknownCode` | `partylink.unknownPairingCode` |
| `common.unknownPlayer` (vanuit rejoin) | `partylink.unknownPlayer` |
| `common.tooManyJoinAttempts`, `common.tooManyReclaimAttempts` | `partylink.rateLimited` (met parameter `operation`) |
| `common.missingArgument` | `partylink.missingArgument` |

Risk-commando's blijven hun eigen codes geven (bv. `common.unknownGame` uit
`LobbyCommandHandler`); de frontend vertaalt beide namespaces.

RiskOP heeft geen externe clients, dus er is geen compatibiliteitsperiode nodig. Deployen mag
op elk moment en de database mag leeg (B14); open TV's en telefoons moeten na de deploy één keer
verversen.

## 6. Fasering

Volgens de werkwijze in CLAUDE.md: **één stap per sessie**, elke stap eerst als
plan-mode-voorstel. Na elke stap: `dotnet build`, `dotnet test`, `pnpm run build` en
`pnpm test` groen, en de werking van Risk ongewijzigd.

Alle werk op een eigen branch (voorstel: `refactor/partylink-extract`), niet op `main`. Fase 1
pas starten als lopende feature-branches die `GameHub`/`useGameState` raken op `main` staan, of
bewust rebasen.

### Fase 0 — beslissingen

- TO-wijzigingen (§8) voorleggen.

### Fase 1 — extraheren binnen RiskOP

| Stap | Inhoud | Klaar als |
| --- | --- | --- |
| 1.1 | Nieuw project `src/PartyLink.Server` (+ `PartyLink.Server.Tests`). Verplaatsen zonder gedragswijziging (in het Engels, B16): `TvPairingRegistry` → `DisplayPairingRegistry`, `PlayerPresenceRegistry` (met `roomId` als term), `GameIdGenerator` → `RoomCodeGenerator`, `HubExceptionLoggingFilter`. Nieuw: `PartyLinkError` + `PartyLinkErrorSerializer` (B5), en in Risk de mapping `ValidationError` → `PartyLinkError`. Daarna een aparte `fix:`-commit voor B17. **Niet in 1.1:** `NullArgumentFilter` (geeft een Risk-foutcode; gaat mee in 1.5) en de groepen (worden een instantie met prefix; gaan mee in 1.3). | golden-string-test op het foutformaat groen vóór en na; registry-tests draaien in `PartyLink.Server.Tests`; Risk gedraagt zich identiek |
| 1.2 | Rate limit: miss-guard voor kamer- en koppelcodes (één venster per client), `[RateLimitedEntry]` voor joinen en overnemen, `IClientKeyResolver` (Risk: forwarded-for-variant). `WatchGame`, `RejoinGame`, `GetActionLog`, `SendGameToTv` en `GET /games/{gameId}/territories` via de guard. | `JoinGameRateLimitFilterTests` gemigreerd; nieuwe test dat raden via `WatchGame` begrensd is |
| 1.3 | Groepen naar het package (`RoomGroups` met configureerbaar prefix, B12). `IRoomStateShape<TState>` + extension methods (klasse- en delegate-variant), `IRoomStateSource<TState>`, `IStateRedactor<TState>`, generieke push. Alle push-plekken (`GameHub`, `TurnTimerBackgroundService`, `HostAbsenceMonitor`) via de generieke push. | `GameHubMissionPrivacyTests` groen, incl. de `Finished`-uitzondering; wire-payload byte-gelijk |
| 1.4 | **Sessies** (race-gevoelig, eigen stap): `ISeatAuthority`, `SeatResult`, `SessionTokens`, `MartenSeatAuthority` (Risk, onder `GameWriteLock`), `InMemoryRoomStore<TState>` met `CreateRoom`/`JoinRoom` (modus b, B13). De dubbele tokencheck en de eviction-volgorde naar het package. | `GameHubReclaimTests`, `GameHubPresenceTests` groen; nieuwe package-tests voor de race "rejoin met oud token tijdens overname" en "overname tijdens verwijderen", voor beide modi |
| 1.5 | **Eerst het contract:** wire-namen, foutcodes en `SeatResponse` omzetten volgens §5 (B4), nog binnen `GameHub`. `NullArgumentFilter` gaat dan mee naar het package (met `partylink.missingArgument`). Frontend en backend in dezelfde commit; daarna deployen (B14). | alle hub- en frontend-tests groen met de nieuwe namen en codes |
| 1.6 | **Dan de structuur:** `RoomHub<TClient, TState>` met `RegisterDisplay`, `SendRoomToDisplay`, `WatchRoom`, `RejoinRoom`, `ReclaimSeat`, `AdmitPlayerAsync`, `ReleaseSeatAsync`, `BroadcastAsync`, `OnPlayerReturnedAsync`. `GameHub` erft ervan. Omdat de namen al generiek zijn, is dit een pure verplaatsing — een regressie is zo bisectbaar tussen contract en structuur. | `GameHub` bevat geen verbindings-/sessielogica meer; geen wire-wijziging |
| 1.7 | `IPresenceListener` + generieke `AbsenceBackgroundService`; `HostAbsenceMonitor` wordt Risk's listener. | host-uitvaltests groen met eigen klok (`TimeProvider`) |
| 1.8 | `AddPartyLink(...)` / `MapPartyLinkHub<T>(...)`; `Program.cs` opgeschoond. | `Program.cs` registreert PartyLink in één blok |
| 1.9a | Frontend deel 1 (eerst `frontend/CLAUDE.md` lezen): pnpm-workspace met `frontend/packages/partylink-react`; `PartyLinkProvider` (met `stateShape`), `useDisplayPairing`, `useSendRoomToDisplay`, `retryBackoff`. Vercel-build en runbook aanpassen. | frontend-tests groen; Vercel-preview bouwt |
| 1.9b | Frontend deel 2: `useRoomState` en `usePlayerSession` met de twee versieregels; `useTvGame` en `useGameState` worden dunne lagen erbovenop; `HoldsSkipped` via `useHubEvent`. | frontend-tests groen; design-conformiteitscheck (timing van retry en holds is zichtbaar gedrag) |

### Fase 2 — tweede gebruiker als bewijs

- Minimale sample-app in `samples/` (voorstel: een quiz-buzzer) met **modus (b)**:
  `InMemoryRoomStore` (B13) met `CreateRoom`/`JoinRoom`, herstelcode als claim, geen database. Display toont de kamer-QR en
  wie er het eerst drukte; telefoons joinen en drukken.
- **Acceptatiecriterium:** de sample gebruikt geen enkel `RiskGame.*`-type en geen bestand uit
  `frontend/src/`. Lukt iets alleen door Risk-code te kopiëren, dan is de grens nog niet goed en
  gaan we terug naar fase 1.
- De sample is tegelijk de quickstart/template voor anderen.

### Fase 3 — eigen repository

1. **Nieuwe, privé repo (B11) met één begincommit** met de inhoud van `src/PartyLink.*`,
   `frontend/packages/partylink-react` en `samples/`, met in de commit message een verwijzing
   naar de RiskOP-commit waar hij vandaan komt. Bewust géén `git filter-repo`: de bestanden zijn
   in Fase 1 verhuisd, dus filteren op de nieuwe paden levert alleen de historie na de
   verhuizing, en de oude paden meenemen haalt de volledige Risk-historie (o.a. `GameHub.cs`)
   binnen.
2. **Lekcheck, vóór elke publicatie (B15):** inhoud nakijken op connection strings,
   Azure-resourcenamen, feed-URL's en persoonlijke gegevens. Vanaf de eerste gepubliceerde
   package is de code openbaar (npm-tarball bevat de bron; een NuGet-dll is te decompileren).
3. Repo-inrichting: README (wat, waarom, quickstart, **beperking: één node**), protocoldocument
   (hub-methodes, events, foutcodes, versieregels, privacygarantie, beveiligingsmodel per
   seat-modus), LICENSE, CONTRIBUTING, eigen CLAUDE.md.
4. CI (GitHub Actions): build, test, pack; publiceren bij een tag naar nuget.org en npm (B6).
   Vooraf: npm-organisatie `@partylink` aanmaken (B10).
5. Versiebeheer: semver, beginnen op `0.x` zolang het contract nog beweegt.
6. RiskOP schakelt van projectreferenties naar de gepubliceerde packages; de bestanden in
   RiskOP worden verwijderd.
7. Sample-app als GitHub-template markeren (B6).
8. Repo openbaar maken (B11), zodra fase 2 klaar is.

## 7. Tests

| Bestaande testset | Gaat naar | Blijft in RiskOP |
| --- | --- | --- |
| `TvPairingRegistryTests` | `PartyLink.Server.Tests` | — |
| `PlayerPresenceRegistryTests` | `PartyLink.Server.Tests` | — |
| `JoinGameRateLimitFilterTests` | `PartyLink.Server.Tests` (attribuut, client-key) | test op de forwarded-for-resolver |
| `GameHubTvPairingTests` | generieke variant tegen een test-hub | één integratietest via `GameHub` |
| `GameHubReclaimTests` | race-tests tegen `InMemoryRoomStore` en een nep-authority | Marten-integratie (`MartenSeatAuthority`, naam-model) |
| `GameHubPresenceTests` | generieke presence/eviction-tests | auto-pass bij terugkomst |
| `GameHubMissionPrivacyTests` | generieke push-test met een nep-redactor | Risk-redactieregels incl. `Finished` |
| Host-uitval | generieke background-loop | auto-pass/host-overdracht |
| (nieuw) raden van kamercodes | miss-guard over alle ingangen | `GET /games/{gameId}/territories` via de guard |
| Frontend-hooks (pairing, versieregels, sessie) | package-tests (vitest) | Risk-schermen |

Per stap worden de testcommando's erbij gegeven.

## 8. Gevolgen voor de ontwerpdocumenten

Het TO is bron van waarheid; aanpassingen worden **voorgelegd**, niet zelfstandig doorgevoerd.

- **TO §1/§2** — PartyLink als externe bouwsteen opnemen, incl. beperking één node (B3).
- **TO §4.1** — presence/host-uitval: verwijzen naar package + Risk-listener.
- **TO §6.1** — groepsnamen worden `game-{id}-all`, `game-{id}-display`, `game-{id}-player-{playerId}`
  (prefix via B12, suffixen generiek); de privacygrens blijft Risk's redactor, de afdwinging zit in
  het package.
- **TO §6.3** — methodenamen volgens §5; Risk gebruikt seat-modus (a); de beschreven volgorde en
  beperkingen blijven gelijk.
- **TO §8** — raden van spelcodes begrensd via de miss-guard over álle ingangen (nu alleen
  `JoinGame`/`RejoinAsPlayer`); joinen en overnemen daarnaast via het attribuut; forwarded headers
  blijven een Risk/Azure-keuze.
- **CLAUDE.md (repo-indeling)** — PartyLink-projecten (fase 1) en later de package-afhankelijkheid
  (fase 3) opnemen.
- **docs/azure-hosting-deployment.md** — Vercel-build met pnpm-workspace (stap 1.9a).
- **FO** — geen wijziging: dit is puur technisch.

## 9. Risico's en aandachtspunten

- **Races in sessiebeheer.** Afgevangen door `ISeatAuthority` atomair te maken (§3.3) en stap 1.4
  apart te houden met tests die de races expliciet nabootsen, voor beide modi.
- **Byte-gelijke wire.** B2 vereist dat Risk's payload niet verandert; stap 1.3 vergelijkt de
  geserialiseerde push vóór en na.
- **Fouttype.** `ValidationError`/`Result<T>` blijven in `RiskGame.Rules`; het package heeft een
  eigen `PartyLinkError` (B5). Het geserialiseerde foutformaat moet gelijk blijven, anders breekt
  de vertaling van foutcodes in de frontend; stap 1.1 test dat.
- **Deployen.** Door B4 werkt een oude frontend niet tegen de nieuwe backend. Geaccepteerd (B14):
  deployen mag op elk moment, de database mag leeg, open TV's en telefoons verversen één keer.
- **Marten blijft in Risk.** Het package krijgt geen Marten-afhankelijkheid. Een losse
  `PartyLink.Marten`-adapter kan later.
- **NuGet-feeds.** [NuGet.Config](../NuGet.Config) staat alleen publieke feeds toe en sluit de
  privé-feed (BluRedSelect) uit. nuget.org past daarbinnen; GitHub Packages vraagt een extra feed
  en dus expliciete toestemming. De privé-feed nooit aan de nieuwe repo toevoegen.
- **Lekcheck vóór publicatie.** Door de begincommit (Fase 3, punt 1) gaat er geen Risk-historie
  mee; de inhoud wordt nagekeken vóór de eerste publicatie (Fase 3, punt 2), want vanaf dan is de
  code openbaar (B15).
- **Nieuwe dependencies.** Fase 1 voegt geen packages toe (alleen eigen projecten/workspace).
  Voor fase 3 (CI-actions, pack-tooling) eerst overleg.
- **Deploy.** De pnpm-workspace verandert de Vercel-build (root-directory, lockfile); stap 1.9a
  is pas klaar als een preview-deploy bouwt.
- **Design.** Het frontend-package is headless. Elke verplaatsing van een hook krijgt toch een
  design-conformiteitscheck, omdat timing (retry, holds) zichtbaar gedrag is.

## 10. Open vragen

Geen. Alle beslissingen staan in §2. Wat nog per stap gekozen wordt (exacte signaturen,
bestandsindeling), komt in het plan-mode-voorstel van die stap.
