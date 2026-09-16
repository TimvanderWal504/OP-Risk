namespace RiskGame.Api.Hubs;

/// <summary>
/// Groepsnaam-conventie voor SignalR (TO §6.1): drie groepen per spel — <c>game-{id}-tv</c>
/// (volledige publieke state), <c>game-{id}-player-{playerId}</c> (publieke state plus de
/// eigen Hand/Mission van die speler) en <c>game-{id}-all</c> (narratieve broadcasts zonder
/// privé-info: dobbelstenen, gebiedsclaims, spelwinst). Staat hier los van <see cref="GameHub"/>
/// zodat niet-hub-aanroepers (<c>TurnTimerBackgroundService</c>, die buiten de hub om via
/// <see cref="Microsoft.AspNetCore.SignalR.IHubContext{THub,T}"/> pusht) nooit een eigen kopie
/// van deze strings kunnen laten uit elkaar lopen.
/// </summary>
public static class GameGroups
{
    public static string All(string gameId) => $"game-{gameId}-all";

    public static string Tv(string gameId) => $"game-{gameId}-tv";

    public static string Player(string gameId, string playerId) => $"game-{gameId}-player-{playerId}";
}
