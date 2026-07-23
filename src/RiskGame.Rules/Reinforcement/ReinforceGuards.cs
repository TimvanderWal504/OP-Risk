using RiskGame.Rules.Map;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Reinforcement;

/// <summary>
/// Regelvalidatie voor de versterkingsfase (FO §5.2): mag deze plaatsing of inleg op deze
/// state, ja of nee. Puur validatie, geen state-mutatie — het daadwerkelijk plaatsen van
/// legers of verwijderen van kaarten hoort bij de command-orchestratie in een latere
/// bouwstap (TO §11, stap 3), net als bij <see cref="Combat.AttackGuards"/>.
/// </summary>
public static class ReinforceGuards
{
    private const int MinHandSizeForMandatoryTrade = 5;

    public static ValidationResult CanPlaceArmies(
        GameState state, string playerId, string territoryId, int amount)
    {
        var preconditions = ValidationResult.Combine(
            Guards.IsActivePlayer(state, playerId),
            Guards.IsInTurnPhase(state, TurnPhase.Reinforce),
            Guards.OwnsTerritory(state, playerId, territoryId));

        if (!preconditions.IsSuccess)
        {
            return preconditions;
        }

        return amount > 0
            ? ValidationResult.Success()
            : ValidationResult.Failure("Er moet minimaal 1 leger geplaatst worden.");
    }

    /// <summary>
    /// Of inleg verplicht is aan het begin van Versterken: bij 5 of meer kaarten in de
    /// hand (FO §5.2). Een pure predicate, geen state-overgang.
    /// </summary>
    public static bool MustTradeInCards(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        return state.Player(playerId).Hand.Count >= MinHandSizeForMandatoryTrade;
    }

    public static ValidationResult CanTradeInCards(
        GameState state, string playerId, IReadOnlyList<string> cardIds)
    {
        ArgumentNullException.ThrowIfNull(cardIds);

        var preconditions = ValidationResult.Combine(
            Guards.IsActivePlayer(state, playerId),
            Guards.IsInTurnPhase(state, TurnPhase.Reinforce));

        if (!preconditions.IsSuccess)
        {
            return preconditions;
        }

        var hand = state.Player(playerId).Hand;
        var cards = new List<Card>(cardIds.Count);

        foreach (var cardId in cardIds)
        {
            var card = hand.FirstOrDefault(card => card.Id == cardId);

            if (card is null)
            {
                return ValidationResult.Failure(
                    $"Speler '{playerId}' heeft kaart '{cardId}' niet in bezit.");
            }

            cards.Add(card);
        }

        return CardSetEvaluator.Validate(state.Map.SetRules, cards);
    }
}
