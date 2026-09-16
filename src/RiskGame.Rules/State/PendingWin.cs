namespace RiskGame.Rules.State;

/// <summary>
/// Een nog niet definitieve overwinning: <paramref name="AchieverPlayerId"/> heeft een
/// bezit-missie vervuld, maar <see cref="GameSettings.MissionWinTiming"/> staat niet op
/// <see cref="MissionWinTiming.EndOfTurn"/>, dus eerst krijgt elke speler in
/// <paramref name="RemainingPlayerIds"/> nog exact één beurt ("laatste kans", FO §6.2) voordat
/// de winst definitief wordt. Null zolang er geen dreigende winnaar is (<see cref="GameState.PendingWin"/>).
/// </summary>
public sealed record PendingWin(string AchieverPlayerId, string MissionId, IReadOnlyList<string> RemainingPlayerIds);
