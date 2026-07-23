using RiskGame.Rules.Map;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Reinforcement;

/// <summary>
/// Berekent de opbrengst van een al-gevalideerde inlegset (zie <see cref="CardSetEvaluator"/>)
/// en de klassiek escalerende volgende inlegwaarde (FO §4.4/§5.2). Puur rekenwerk: of de
/// set geldig is en of de speler hem mag inleveren is al door <see cref="ReinforceGuards"/>
/// gecontroleerd.
/// </summary>
public static class CardTradeCalculator
{
    private static readonly int[] FixedSteps = [4, 6, 8, 10, 12, 15];
    private const int EscalationStep = 5;

    public static CardTradeOutcome Evaluate(GameState state, string playerId, IReadOnlyList<Card> cards)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);
        ArgumentNullException.ThrowIfNull(cards);

        var ownedTerritoryBonuses = cards
            .Where(card => card.TerritoryId is not null
                && state.Territory(card.TerritoryId!).OwnerPlayerId == playerId)
            .Select(card => new TerritoryBonus(card.TerritoryId!, state.Map.SetRules.OwnedTerritoryBonus))
            .ToList();

        return new CardTradeOutcome(state.Deck.NextTradeValue, ownedTerritoryBonuses);
    }

    /// <summary>De volgende inlegwaarde na deze inleg: 4, 6, 8, 10, 12, 15, daarna +5.</summary>
    public static int NextTradeValueAfter(int current)
    {
        var index = Array.IndexOf(FixedSteps, current);

        if (index >= 0 && index < FixedSteps.Length - 1)
        {
            return FixedSteps[index + 1];
        }

        return current >= FixedSteps[^1] ? current + EscalationStep : FixedSteps[0];
    }
}
