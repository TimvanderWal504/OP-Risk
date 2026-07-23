using RiskGame.Rules.Map;

namespace RiskGame.Rules.State;

/// <summary>
/// De stand van het kaartendeck (FO §5.2). Het deck zelf wordt afgeleid uit de gebieden
/// van de kaartvariant (<see cref="MapDefinition.Deck"/>); hier staat alleen waar de
/// kaarten op dit moment liggen.
/// </summary>
/// <param name="NextTradeValue">
/// Wat de eerstvolgende inleg oplevert. Klassiek escalerend: 4, 6, 8, 10, 12, 15 en
/// daarna telkens +5.
/// </param>
public sealed record DeckState(
    IReadOnlyList<Card> DrawPile,
    IReadOnlyList<Card> DiscardPile,
    int NextTradeValue);
