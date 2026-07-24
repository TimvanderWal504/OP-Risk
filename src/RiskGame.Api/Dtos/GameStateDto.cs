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
    int StateVersion = 0);

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
public sealed record PlayerColorDto(string Id, string Name, string Hex, string Symbol);

/// <summary>
/// Draad-representatie van de rolcatalogus voor de rolkeuzestap (FO §8/§10, alleen
/// relevant bij RoleAssignment = Kiezen) — zonder het effect-detail; dat is spellogica die
/// de server toepast, niet iets dat de client zelf hoeft te tonen om te kunnen kiezen.
/// </summary>
public sealed record RoleSummaryDto(string Id, string Name, string Description);

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
