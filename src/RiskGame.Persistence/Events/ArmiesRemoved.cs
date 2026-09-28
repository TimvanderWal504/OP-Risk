namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler heeft legers afgestaan voor een <c>ArmyAttrition</c>-kaart (FO §9.2): zijn eigen
/// keuze, of het automatische maximum als hij geen keuzevrijheid had. De verdeling is al
/// gevalideerd (<see cref="Rules.Effects.ArmyAttritionCalculator"/>).
/// </summary>
public sealed record ArmiesRemoved(string GameId, string PlayerId, IReadOnlyDictionary<string, int> RemovedByTerritory);
