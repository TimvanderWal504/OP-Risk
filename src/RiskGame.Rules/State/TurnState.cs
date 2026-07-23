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
public sealed record TurnState(
    string ActivePlayerId,
    TurnPhase TurnPhase,
    PhaseTimer? Timer,
    PendingCombat? PendingCombat);
