namespace RiskGame.Persistence.Events;

/// <summary>
/// <paramref name="ResolvedPlayerId"/> heeft zijn laatste-kans-beurt beëindigd zonder
/// <paramref name="AchieverPlayerId"/>'s missie te breken, en er zijn nog andere spelers in
/// <paramref name="RemainingPlayerIds"/> over die hun beurt nog tegoed hebben (FO §6.2). Zodra
/// <paramref name="RemainingPlayerIds"/> leeg zou worden, wordt in plaats hiervan het bestaande
/// <c>GameWon</c>-event ge-appendt — dit event komt dus nooit met een lege lijst voor. Met auto-pass
/// (FO §11.2) kan de lijst ook krimpen bij het beurteinde van een speler die er niet (meer) in stond,
/// omdat een ander inmiddels op auto-pass staat; <paramref name="ResolvedPlayerId"/> is dan de speler
/// wiens beurteinde het venster opnieuw liet bepalen, niet iemand die zijn kans benutte.
/// </summary>
public sealed record PendingWinNarrowed(
    string GameId, string AchieverPlayerId, string ResolvedPlayerId, IReadOnlyList<string> RemainingPlayerIds);
