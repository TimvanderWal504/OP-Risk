namespace RiskGame.Persistence.Events;

/// <summary>
/// De verdediger heeft zijn <c>DefenseBoost</c>-rol ingezet (FO §5.3 stap 4, §8.1): met 2
/// dobbelstenen verdedigd tegen een aanval met 1, onder de Huisregel. Apart feit naast
/// <see cref="CombatResolved"/>; de vouwregel zet <see cref="Rules.State.Player.DefenseBoostUsed"/>,
/// een <see cref="PhaseChanged"/> naar Versterken van dezelfde speler zet 'm terug.
/// </summary>
public sealed record DefenseBoostUsed(string GameId, string PlayerId);
