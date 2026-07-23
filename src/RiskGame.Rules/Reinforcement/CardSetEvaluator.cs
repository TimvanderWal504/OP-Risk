using RiskGame.Rules.Map;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Reinforcement;

/// <summary>
/// Of een set van precies drie kaarten een geldige inlegset is (FO §4.4): drie gelijke
/// symbolen, of drie verschillende, met een joker als wildcard voor beide. Puur
/// validatie op de kaarten zelf — of de speler ze ook daadwerkelijk bezit hoort bij
/// <see cref="ReinforceGuards"/>.
/// </summary>
public static class CardSetEvaluator
{
    private const int SetSize = 3;
    private const string ThreeOfAKind = "three-of-a-kind";
    private const string OneOfEach = "one-of-each";

    public static ValidationResult Validate(CardSetRules rules, IReadOnlyList<Card> cards)
    {
        ArgumentNullException.ThrowIfNull(rules);
        ArgumentNullException.ThrowIfNull(cards);

        if (cards.Count != SetSize)
        {
            return ValidationResult.Failure(
                $"Een kaartenset bestaat uit precies {SetSize} kaarten, niet {cards.Count}.");
        }

        var jokerCount = cards.Count(card => card.IsJoker);

        if (jokerCount > 0 && !rules.JokerIsWild)
        {
            return ValidationResult.Failure("Jokers zijn in dit spel niet inzetbaar in een set.");
        }

        var nonJokerSymbols = cards
            .Where(card => !card.IsJoker)
            .Select(card => card.Symbol)
            .ToList();

        var distinctSymbols = nonJokerSymbols.Distinct(StringComparer.Ordinal).Count();

        var isThreeOfAKind = distinctSymbols <= 1 && rules.ValidSets.Contains(ThreeOfAKind);
        var isOneOfEach = distinctSymbols == nonJokerSymbols.Count && rules.ValidSets.Contains(OneOfEach);

        return isThreeOfAKind || isOneOfEach
            ? ValidationResult.Success()
            : ValidationResult.Failure(
                "Deze kaarten vormen geen geldige set (drie gelijke of drie verschillende " +
                "symbolen, jokers tellen als wildcard).");
    }
}
