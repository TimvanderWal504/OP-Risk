namespace RiskGame.Rules.AutoPass;

/// <summary>Een plaatsing uit de versterkingspool die de server doet voor een speler op auto-pass.</summary>
public sealed record ArmyPlacement(string TerritoryId, int Amount);
