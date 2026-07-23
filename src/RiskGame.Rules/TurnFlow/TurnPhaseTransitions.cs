using RiskGame.Rules.State;

namespace RiskGame.Rules.TurnFlow;

/// <summary>
/// De vaste volgorde van de beurtstructuur (FO §5.2): Versterken → Aanvallen →
/// Verplaatsen. Puur rekenwerk, geen state-mutatie — zie <see cref="TurnGuards"/> voor de
/// vraag of een overgang op dit moment mag.
/// </summary>
public static class TurnPhaseTransitions
{
    /// <summary>
    /// De fase ná <paramref name="current"/> binnen dezelfde beurt. Verplaatsen heeft geen
    /// volgende fase binnen de beurt — dat is <c>EndTurn</c>, niet <c>EndPhase</c>.
    /// </summary>
    public static TurnPhase Next(TurnPhase current) => current switch
    {
        TurnPhase.Reinforce => TurnPhase.Attack,
        TurnPhase.Attack => TurnPhase.Fortify,
        TurnPhase.Fortify => throw new ArgumentOutOfRangeException(
            nameof(current), current,
            "Verplaatsen is de laatste fase van de beurt; gebruik EndTurn."),
        _ => throw new ArgumentOutOfRangeException(nameof(current), current, "Onbekende fase."),
    };
}
