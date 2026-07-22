namespace RiskGame.Rules.Map;

/// <summary>
/// Leidt het territoriumkaarten-deck af uit de gebieden van een kaartvariant, in plaats
/// van het als vaste lijst in te lezen. Zo kan een variant nooit een deck hebben dat niet
/// bij zijn eigen gebieden past (FO §4.4).
/// </summary>
public static class CardDeckBuilder
{
    /// <summary>Symbool van een joker; komt overeen met de sleutel in de thema's.</summary>
    public const string JokerSymbol = "joker";

    /// <summary>
    /// Eén kaart per gebied, alfabetisch op gebied-id met de symbolen cyclisch verdeeld,
    /// gevolgd door de jokers. Deterministisch: dezelfde invoer geeft altijd hetzelfde
    /// deck, wat nodig is voor replay en tests.
    /// </summary>
    public static IReadOnlyList<Card> Build(
        IEnumerable<Territory> territories,
        IReadOnlyList<string> symbols,
        int jokerCount)
    {
        ArgumentNullException.ThrowIfNull(territories);
        ArgumentNullException.ThrowIfNull(symbols);

        if (symbols.Count == 0)
        {
            throw new ArgumentException(
                "Er is minstens één kaartsymbool nodig om een deck af te leiden.", nameof(symbols));
        }

        ArgumentOutOfRangeException.ThrowIfNegative(jokerCount);

        var territoryIds = territories
            .Select(territory => territory.Id)
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToList();

        var deck = new List<Card>(territoryIds.Count + jokerCount);

        for (var index = 0; index < territoryIds.Count; index++)
        {
            var territoryId = territoryIds[index];
            deck.Add(new Card($"card-{territoryId}", territoryId, symbols[index % symbols.Count]));
        }

        for (var joker = 1; joker <= jokerCount; joker++)
        {
            deck.Add(new Card($"card-joker-{joker}", TerritoryId: null, JokerSymbol));
        }

        return deck;
    }
}
