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

    /// <summary>
    /// <c>internal</c> (niet <c>private</c>) omdat <see cref="Map.MapDefinitionParser"/> op
    /// deze zelfde letterlijke waarde moet valideren (FO §5.2, taak 3: de 5+-inlegverplichting
    /// mag een speler nooit vastzetten) — één bron van waarheid voor de setsoort-strings i.p.v.
    /// een tweede, los kopieerbare constante (src/CLAUDE.md, DRY).
    /// </summary>
    internal const string ThreeOfAKind = "three-of-a-kind";

    /// <summary>Zie doc-comment op <see cref="ThreeOfAKind"/>.</summary>
    internal const string OneOfEach = "one-of-each";

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

    /// <summary>
    /// Of er ergens in <paramref name="hand"/> een drietal zit dat <see cref="Validate"/> zou
    /// goedkeuren — niet welk drietal, alleen of er één bestaat. Puur een kaarten-check, net
    /// als <see cref="Validate"/>: geen fase-/eigendomscontrole (dat is
    /// <see cref="ReinforceGuards.CanTradeInCards"/>, die een door de speler <em>gekozen</em>
    /// drietal valideert inclusief fase/eigendom — een ander concept). Brute-force over alle
    /// C(n,3)-deelverzamelingen en hergebruikt <see cref="Validate"/> per combinatie, bewust
    /// geen losse telformule (aantal per symbool + jokers): dat zou de setregels een tweede
    /// keer coderen (DRY, src/CLAUDE.md) en kan uit de pas raken met <see cref="Validate"/> als
    /// de regels ooit wijzigen. Handen zijn klein genoeg (deck van 45 kaarten voor
    /// standaard-43) dat dit triviaal snel is voor één aanroep per state-broadcast.
    /// </summary>
    public static bool HasTradeableSet(CardSetRules rules, IReadOnlyList<Card> hand)
    {
        ArgumentNullException.ThrowIfNull(rules);
        ArgumentNullException.ThrowIfNull(hand);

        if (hand.Count < SetSize)
        {
            return false;
        }

        return ThreeCardCombinations(hand).Any(combination => Validate(rules, combination).IsSuccess);
    }

    /// <summary>Alle C(n,3)-deelverzamelingen van drie kaarten uit <paramref name="cards"/>, orde-onafhankelijk.</summary>
    private static IEnumerable<IReadOnlyList<Card>> ThreeCardCombinations(IReadOnlyList<Card> cards)
    {
        for (var i = 0; i < cards.Count - 2; i++)
        {
            for (var j = i + 1; j < cards.Count - 1; j++)
            {
                for (var k = j + 1; k < cards.Count; k++)
                {
                    yield return [cards[i], cards[j], cards[k]];
                }
            }
        }
    }
}
