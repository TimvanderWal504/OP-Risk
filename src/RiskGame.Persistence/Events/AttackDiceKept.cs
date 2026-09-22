namespace RiskGame.Persistence.Events;

/// <summary>
/// De aanvaller kiest "Doorgaan" tijdens de open herwerp-beslissing (FO §5.3 stap 3, §8.1,
/// plan-rollen A1/A8): sluit de beslissing (<see cref="Rules.State.PendingCombat.AwaitingRerollDecision"/>
/// → <see langword="false"/>) zonder de worp te wijzigen. Voegt <see cref="ToTerritoryId"/>
/// bewust **niet** toe aan <see cref="Rules.State.TurnState.RerolledTargetTerritoryIds"/> — A8:
/// "Doorgaan" verbruikt het herwerp voor dit doelgebied niet, dus een latere worp tegen
/// hetzelfde doelgebied krijgt de beslissing opnieuw aangeboden.
/// </summary>
/// <param name="ToTerritoryId">Het doelgebied van het lopende gevecht.</param>
public sealed record AttackDiceKept(string GameId, string PlayerId, string ToTerritoryId);
