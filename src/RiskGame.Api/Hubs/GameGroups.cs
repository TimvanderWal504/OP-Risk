namespace RiskGame.Api.Hubs;

/// <summary>
/// Groepsnaam-conventie voor SignalR (TO §6.1): één spelgroep, <c>game-{id}-all</c>. Staat hier
/// los van <see cref="GameHub"/> zodat niet-hub-aanroepers (<c>TurnTimerBackgroundService</c>,
/// die buiten de hub om via <see cref="Microsoft.AspNetCore.SignalR.IHubContext{THub,T}"/>
/// pusht) nooit een eigen kopie van deze string kunnen laten uit elkaar lopen.
/// </summary>
public static class GameGroups
{
    public static string All(string gameId) => $"game-{gameId}-all";
}
