namespace RiskGame.Api.Dtos;

/// <summary>
/// Draad-representatie van de lobby-relevante velden van <see cref="RiskGame.Rules.State.GameState"/>.
/// Groeit in latere plakken mee met wat de volgende fases nodig hebben.
/// </summary>
public sealed record GameStateDto(
    string GameId,
    GamePhaseDto Phase,
    IReadOnlyList<PlayerDto> Players,
    IReadOnlyList<string> AvailableColorIds,
    IReadOnlyList<string> TurnOrder,
    IReadOnlyList<TerritoryDto> Territories,
    TurnStateDto? TurnState,
    IReadOnlyList<PlayerColorDto> Colors,
    IReadOnlyList<RoleSummaryDto> Roles,
    GameSettingsDto Settings,
    OrderRollStateDto? OrderRollState = null,
    SetupStateDto? SetupState = null,
    int StateVersion = 0);

/// <summary>
/// Alles wat een client tijdens <see cref="GamePhaseDto.Claiming"/>/
/// <see cref="GamePhaseDto.InitialPlacement"/> nodig heeft om de startopstelling te tonen
/// zónder zelf spelregels na te rekenen (FO §5.1). <see cref="GameStateDto.TurnState"/> is in
/// deze fases nog <c>null</c>; de mapper leidt alles hier af via dezelfde calculators en guards
/// die de server-side validatie gebruikt.
/// </summary>
/// <param name="ActivePlayerId">
/// Wie er aan zet is. <c>null</c> tijdens <see cref="GamePhaseDto.InitialPlacement"/> bij
/// <see cref="RiskGame.Rules.State.SetupMode.Random"/>: daar plaatst iedereen gelijktijdig, er
/// is geen "actieve" speler (FO §5.1). Dat onderscheid is hiermee volledig af te lezen — een
/// client hoort er géén tweede veld of de opstelmodus voor nodig te hebben.
/// </param>
/// <param name="RemainingArmiesByPlayer">
/// Hoeveel startlegers elke speler nog moet plaatsen
/// (<see cref="RiskGame.Rules.TurnFlow.SetupTurnCalculator.RemainingArmiesFor"/>). Per speler en
/// niet alleen voor de ontvanger: de state-push gaat naar de hele spelgroep, en legeraantallen
/// zijn openbaar.
/// </param>
/// <param name="ClaimableTerritoryIdsByPlayer">
/// Welke gebieden elke speler mag claimen
/// (<see cref="RiskGame.Rules.Validation.SetupGuards.ClaimableTerritoryIdsFor"/>): vrije gebieden
/// minus het eigen rol-herkomstland (FO §8.1). Per speler verschillend, en dat lekt niets: rollen
/// zijn openbaar (FO §8) en het herkomstland is al af te leiden uit <see cref="PlayerDto.RoleId"/>
/// plus <see cref="RoleSummaryDto.OriginTerritory"/>, die beide naar iedereen gaan. Wordt dat ooit
/// verborgen informatie, dan moet dit veld mee naar de per-speler-push (TO §6.1).
/// Let op bij groei: dit is het eerste veld dat kwadratisch meeschaalt (spelers × gebieden) en het
/// gaat bij elke claim opnieuw naar iedereen. Op deze schaal verwaarloosbaar; knelt de payload
/// ooit, dan is dit de plek — de lijsten zijn per speler bijna identiek.
/// </param>
public sealed record SetupStateDto(
    string? ActivePlayerId,
    IReadOnlyDictionary<string, int> RemainingArmiesByPlayer,
    IReadOnlyDictionary<string, IReadOnlyList<string>> ClaimableTerritoryIdsByPlayer);

/// <summary>
/// Draad-representatie van de territoriumcatalogus van de kaartvariant
/// (<see cref="RiskGame.Rules.Map.Territory"/>) — alleen het continent; de weergavenaam komt
/// client-side via <c>tDynamic(id, 'territories')</c> (frontend/src/locales/territories.ts),
/// nooit het <c>Name</c>-veld uit de brondata (zelfde patroon als <c>RoleSummaryDto</c>).
/// Statische data, bewust los van <see cref="GameStateDto"/>: verandert nooit tijdens een
/// spel, dus geen reden om 'm op elke state-push mee te sturen.
/// </summary>
public sealed record TerritoryCatalogDto(string Id, string Continent);

/// <summary>
/// Wie er nu nog mag gooien voor de spelersvolgorde (FO §2.1). Alleen gevuld door
/// <c>StartGame</c> (bij binnenkomst in de fase: iedereen) en <c>RollForOrder</c> (de
/// tie-break-voortgang uit <see cref="RiskGame.Rules.TurnFlow.OrderRollCalculator"/> — al
/// berekend, dus geen event-stream-toegang nodig in de mapper). <c>WatchGame</c> levert dit
/// veld niet: reconnect midden in een order-roll is bouwstap 6.
/// </summary>
public sealed record OrderRollStateDto(IReadOnlyList<string> PlayersStillToRoll);

/// <summary>
/// Draad-representatie van de kleurencatalogus van de kaartvariant
/// (<see cref="RiskGame.Rules.Map.PlayerColor"/>) — nooit hardcoden aan de TS-kant
/// (src/CLAUDE.md, DRY), dus de volledige catalogus (incl. hex/symbol) gaat mee met de
/// state. <see cref="GameStateDto.AvailableColorIds"/> blijft de lijst van nog vrije id's.
/// </summary>
public sealed record PlayerColorDto(string Id, string Name, string Hex, string OnHex, string Symbol);

/// <summary>
/// Draad-representatie van de rolcatalogus voor de rolkeuzestap (FO §8/§10, alleen
/// relevant bij RoleAssignment = Kiezen) — zonder het effect-detail; dat is spellogica die
/// de server toepast, niet iets dat de client zelf hoeft te tonen om te kunnen kiezen.
/// <paramref name="OriginTerritory"/> is het herkomstland (territory-id) waar de rolbonus
/// aan gekoppeld is; de client toont dat naast de rolnaam (join-flow, design Telefoon L316/L345).
/// </summary>
public sealed record RoleSummaryDto(string Id, string Name, string Description, string OriginTerritory);

public sealed record TerritoryDto(string TerritoryId, string? OwnerPlayerId, int ArmyCount);

/// <summary>
/// Draad-representatie van <see cref="RiskGame.Rules.State.TurnState"/>. Nog geen timer —
/// die hoort bij een latere plak (aftellen, TO §5.3).
/// </summary>
public sealed record TurnStateDto(
    string ActivePlayerId, TurnPhaseDto TurnPhase, int ArmiesRemaining, PendingCombatDto? PendingCombat);

/// <summary>Draad-representatie van <see cref="RiskGame.Rules.State.PendingCombat"/>.</summary>
public sealed record PendingCombatDto(string FromTerritoryId, string ToTerritoryId, int AttackDice);

public enum TurnPhaseDto
{
    Reinforce,
    Attack,
    Fortify,
}

public enum GamePhaseDto
{
    Lobby,
    OrderRoll,
    Claiming,
    InitialPlacement,
    InProgress,
    Finished,
}
