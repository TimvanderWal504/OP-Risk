namespace RiskGame.Rules.Map;

/// <summary>
/// Spelerskleur. <paramref name="Symbol"/> is het kleurenblind-vriendelijke teken dat
/// naast de kleur getoond wordt. Missies verwijzen naar spelers via <paramref name="Id"/>
/// (FO §6.1), dus die moet uniek zijn.
/// </summary>
public sealed record PlayerColor(string Id, string Name, string Hex, string Symbol);
