namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler heeft legers afgestaan voor een <c>ArmyAttrition</c>-kaart (FO §9.2): zijn eigen
/// keuze, of het automatische maximum als hij geen keuzevrijheid had. De verdeling is al
/// gevalideerd (<see cref="Rules.Effects.ArmyAttritionCalculator"/>). Een lege verdeling betekent
/// "deze speler is afgehandeld zonder iets af te staan": al zijn gebieden hebben 1 leger. Zo staat
/// ook die speler in het verloop (FO §9.2), in plaats van stil weg te vallen.
/// </summary>
public sealed record ArmiesRemoved(string GameId, string PlayerId, IReadOnlyDictionary<string, int> RemovedByTerritory);
