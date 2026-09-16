namespace RiskGame.Persistence.Events;

/// <summary>
/// <paramref name="BrokenByPlayerId"/> heeft tijdens zijn laatste-kans-beurt
/// <paramref name="AchieverPlayerId"/>'s <paramref name="MissionId"/>-missie ongeldig gemaakt
/// (bv. een gebied heroverd) — het laatste-kans-venster vervalt, het spel gaat gewoon door en
/// niemand raakt uitgesloten van later alsnog winnen (FO §6.2). <paramref name="MissionId"/>
/// wordt niet door de vouwregel gebruikt (die zet alleen <c>PendingWin</c> op <c>null</c>) maar
/// staat op het event voor audit-/toekomstig TV-gebruik ("welke missie brak af").
/// </summary>
public sealed record PendingWinBroken(string GameId, string AchieverPlayerId, string MissionId, string BrokenByPlayerId);
