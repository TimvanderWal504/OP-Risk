namespace RiskGame.Rules.State;

/// <summary>De stand van de lopende beurt (TO §3.1).</summary>
/// <param name="Timer">
/// Null betekent "geen timer": de lobby en de setup-fases hebben er geen, en ook de
/// verdediger-keuze is bewust timerloos (FO §5.3).
/// </param>
/// <param name="PendingCombat">
/// Niet-null zolang een gevecht loopt. De beurt blijft dan in
/// <see cref="TurnPhase.Attack"/> — wachten op de verdediger is geen aparte fase (TO §4.1).
/// </param>
/// <param name="ArmiesRemaining">
/// Nog te plaatsen legers uit de vrije versterkingspool (FO §5.2): gezet bij het ingaan van
/// <see cref="TurnPhase.Reinforce"/> op <see cref="Reinforcement.ReinforcementCalculator.CalculateArmies"/>,
/// nadien bijgewerkt door <c>ArmiesReinforced</c> (aftrek) en <c>CardsTraded</c> (optelling
/// van de setwaarde). Buiten Versterken ongebruikt (0).
/// </param>
public sealed record TurnState(
    string ActivePlayerId,
    TurnPhase TurnPhase,
    PhaseTimer? Timer,
    PendingCombat? PendingCombat,
    int ArmiesRemaining = 0);
