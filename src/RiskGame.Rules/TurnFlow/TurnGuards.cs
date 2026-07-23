using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.TurnFlow;

/// <summary>
/// Regelvalidatie voor <c>EndPhase</c> en <c>EndTurn</c> (TO §4.1): mag deze speler de
/// huidige fase of beurt nu afsluiten. Puur validatie, geen state-mutatie — het
/// daadwerkelijk doorschuiven naar de volgende fase of speler hoort bij de
/// command-orchestratie in een latere bouwstap (TO §11, stap 3), net als bij
/// <see cref="Combat.AttackGuards"/>, <see cref="Reinforcement.ReinforceGuards"/> en
/// <see cref="Fortify.FortifyGuards"/>.
/// </summary>
public static class TurnGuards
{
    /// <summary>
    /// Of <paramref name="playerId"/> de huidige fase mag afsluiten (Versterken →
    /// Aanvallen, of Aanvallen → Verplaatsen). Verplaatsen zelf heeft geen volgende fase
    /// binnen de beurt; die sluit je af met <see cref="CanEndTurn"/>.
    /// </summary>
    public static ValidationResult CanEndPhase(GameState state, string playerId)
    {
        var preconditions = Guards.IsActivePlayer(state, playerId);

        if (!preconditions.IsSuccess)
        {
            return preconditions;
        }

        return state.TurnState!.TurnPhase switch
        {
            TurnPhase.Reinforce => ValidationResult.Success(),
            TurnPhase.Attack => state.TurnState.PendingCombat is null
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    "Er loopt nog een gevecht; wacht tot dat is afgehandeld."),
            TurnPhase.Fortify => ValidationResult.Failure(
                "Verplaatsen is de laatste fase van de beurt; gebruik EndTurn om de " +
                "beurt te beëindigen."),
            _ => ValidationResult.Failure("Onbekende fase."),
        };
    }

    /// <summary>
    /// Of <paramref name="playerId"/> de beurt mag beëindigen. Dat kan alleen vanuit
    /// Verplaatsen — de laatste fase van de beurt (FO §5.2, §5.5).
    /// </summary>
    public static ValidationResult CanEndTurn(GameState state, string playerId) =>
        ValidationResult.Combine(
            Guards.IsActivePlayer(state, playerId),
            Guards.IsInTurnPhase(state, TurnPhase.Fortify));
}
