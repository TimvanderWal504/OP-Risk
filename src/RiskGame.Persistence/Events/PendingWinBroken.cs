namespace RiskGame.Persistence.Events;

/// <summary>
/// <paramref name="BrokenByPlayerId"/> heeft tijdens zijn laatste-kans-beurt
/// <paramref name="AchieverPlayerId"/>'s <paramref name="MissionId"/>-missie ongeldig gemaakt
/// (bv. een gebied heroverd) — het laatste-kans-venster vervalt, het spel gaat gewoon door en
/// niemand raakt uitgesloten van later alsnog winnen (FO §6.2). <paramref name="MissionId"/>
/// wordt niet door de vouwregel gebruikt (die zet alleen <c>PendingWin</c> op <c>null</c>) maar
/// staat op het event voor audit-/toekomstig TV-gebruik ("welke missie brak af").
/// </summary>
/// <param name="BrokenByPlayerId">
/// <c>null</c> als het venster vervalt zonder aanwijsbare dader (FO §6.2, §11.2): alle resterende
/// tegenstanders staan inmiddels op auto-pass en de missie geldt niet meer, maar de beurt die net
/// eindigde was geen laatste-kans-beurt. Het venster kan dan niet open blijven — er komt nooit meer
/// een laatste-kans-beurt — en wie het brak, valt niet aan te wijzen. Zonder dader geen verloopregel.
/// </param>
public sealed record PendingWinBroken(string GameId, string AchieverPlayerId, string MissionId, string? BrokenByPlayerId);
