using RiskGame.Rules.Reinforcement;
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
            // FO §5.2: inleggen bij 5+ kaarten gaat vóór alles, ook vóór "fase klaar" —
            // zelfde volgorde als ReinforceGuards.CanPlaceArmies.
            TurnPhase.Reinforce => ReinforceGuards.MustTradeInCards(state, playerId)
                ? ValidationResult.Failure("reinforce.mustTradeInCardsFirst")
                : state.TurnState.ArmiesRemaining == 0
                    ? ValidationResult.Success()
                    : ValidationResult.Failure("turnFlow.armiesRemaining"),
            // FO §7 (taak 4): dezelfde volgorde als Aanvallen zelf (AttackGuards.CanDeclareAttack)
            // — eerst het lopende gevecht, dan een eventuele ≥6-inlegverplichting, dan een nog
            // niet geplaatste inlegpool. Pas als dat alles leeg is mag de fase dicht.
            TurnPhase.Attack => state.TurnState.PendingCombat is not null
                ? ValidationResult.Failure("turnFlow.combatInProgress")
                : ReinforceGuards.MustTradeInCardsDuringAttack(state, playerId)
                    ? ValidationResult.Failure("reinforce.mustTradeInCardsFirst")
                    : state.TurnState.ArmiesRemaining == 0
                        ? ValidationResult.Success()
                        : ValidationResult.Failure("turnFlow.armiesRemaining"),
            TurnPhase.Fortify => ValidationResult.Failure("turnFlow.useEndTurnInFortify"),
            _ => ValidationResult.Failure("turnFlow.unknownPhase"),
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
