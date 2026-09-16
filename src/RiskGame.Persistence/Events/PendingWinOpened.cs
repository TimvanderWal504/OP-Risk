namespace RiskGame.Persistence.Events;

/// <summary>
/// <paramref name="AchieverPlayerId"/> heeft een bezit-missie vervuld, maar
/// <see cref="Rules.State.GameSettings.MissionWinTiming"/> staat niet op <c>EndOfTurn</c> (FO
/// §6.2), dus het laatste-kans-venster opent: elke speler in <paramref name="RemainingPlayerIds"/>
/// krijgt nog exact één beurt voordat de overwinning definitief is.
/// </summary>
public sealed record PendingWinOpened(
    string GameId, string AchieverPlayerId, string MissionId, IReadOnlyList<string> RemainingPlayerIds);
