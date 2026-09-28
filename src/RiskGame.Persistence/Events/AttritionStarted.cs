namespace RiskGame.Persistence.Events;

/// <summary>
/// Een <c>ArmyAttrition</c>-kaart wacht op de keuzes van de spelers met keuzevrijheid (FO §9.2).
/// Wie moet kiezen en wiens beurt daarna begint, heeft de server al bepaald. Sluit de lopende
/// beurt: tot de laatste keuze bestaat er geen <see cref="Rules.State.TurnState"/>.
/// </summary>
public sealed record AttritionStarted(
    string GameId, string EventId, int Amount, IReadOnlyList<string> AwaitingPlayerIds, string NextPlayerId);
