namespace RiskGame.Rules.Combat;

/// <summary>
/// De uitkomst van één worp-vergelijking (FO §5.3): wat er gerold is en hoeveel
/// legers elke kant daardoor verliest. Bevat bewust geen oordeel over verovering —
/// of het doelgebied daadwerkelijk valt hangt af van de legers die daar al stonden,
/// en dat is state, geen gevechtslogica.
/// </summary>
/// <param name="AttackerRolls">Aanvallers worp, aflopend gesorteerd.</param>
/// <param name="DefenderRolls">Verdedigers worp, aflopend gesorteerd.</param>
/// <param name="AttackerLosses">Legers die de aanvaller verliest.</param>
/// <param name="DefenderLosses">Legers die de verdediger verliest.</param>
public sealed record CombatOutcome(
    IReadOnlyList<int> AttackerRolls,
    IReadOnlyList<int> DefenderRolls,
    int AttackerLosses,
    int DefenderLosses);
