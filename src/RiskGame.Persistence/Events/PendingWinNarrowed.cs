namespace RiskGame.Persistence.Events;

/// <summary>
/// <paramref name="ResolvedPlayerId"/> heeft zijn laatste-kans-beurt beëindigd zonder
/// <paramref name="AchieverPlayerId"/>'s missie te breken, en er zijn nog andere spelers in
/// <paramref name="RemainingPlayerIds"/> over die hun beurt nog tegoed hebben (FO §6.2). Zodra
/// <paramref name="RemainingPlayerIds"/> leeg zou worden, wordt in plaats hiervan het bestaande
/// <c>GameWon</c>-event ge-appendt — dit event komt dus nooit met een lege lijst voor.
/// </summary>
public sealed record PendingWinNarrowed(
    string GameId, string AchieverPlayerId, string ResolvedPlayerId, IReadOnlyList<string> RemainingPlayerIds);
