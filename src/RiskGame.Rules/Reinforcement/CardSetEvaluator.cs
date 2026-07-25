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
                "reinforce.invalidCardSetSize",
                new Dictionary<string, string> { ["expected"] = SetSize.ToString(), ["actual"] = cards.Count.ToString() });
        }

        var jokerCount = cards.Count(card => card.IsJoker);

        if (jokerCount > 0 && !rules.JokerIsWild)
        {
            return ValidationResult.Failure("reinforce.jokersNotAllowed");
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
            : ValidationResult.Failure("reinforce.invalidCardSet");
    }
}
