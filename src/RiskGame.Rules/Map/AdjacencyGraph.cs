using System.Collections.Frozen;

namespace RiskGame.Rules.Map;

/// <summary>
/// De aangrenzingsgraaf. Grenzen worden in beide richtingen geregistreerd (TO §3.3),
/// zodat een gebied altijd terugvindbaar is ongeacht hoe de grens in de data staat.
/// </summary>
public sealed class AdjacencyGraph
{
    private static readonly IReadOnlyList<Border> None = [];

    private readonly FrozenDictionary<string, IReadOnlyList<Border>> _byTerritory;

    public AdjacencyGraph(IEnumerable<Border> borders)
    {
        ArgumentNullException.ThrowIfNull(borders);

        var accumulator = new Dictionary<string, List<Border>>(StringComparer.Ordinal);

        foreach (var border in borders)
        {
            Add(accumulator, border.From, border);
            Add(accumulator, border.To, border);
        }

        _byTerritory = accumulator.ToFrozenDictionary(
            pair => pair.Key,
            pair => (IReadOnlyList<Border>)pair.Value,
            StringComparer.Ordinal);
    }

    /// <summary>De grenzen van een gebied; leeg als het gebied geen grenzen heeft.</summary>
    public IReadOnlyList<Border> Borders(string territoryId) =>
        _byTerritory.TryGetValue(territoryId, out var borders) ? borders : None;

    /// <summary>De id's van de aangrenzende gebieden.</summary>
    public IEnumerable<string> Neighbours(string territoryId) =>
        Borders(territoryId).Select(border => Other(border, territoryId));

    public bool IsAdjacent(string from, string to) =>
        Borders(from).Any(border => Other(border, from) == to);

    /// <summary>Het gebied aan de andere kant van een grens.</summary>
    private static string Other(Border border, string territoryId) =>
        border.From == territoryId ? border.To : border.From;

    private static void Add(
        Dictionary<string, List<Border>> accumulator, string territoryId, Border border)
    {
        if (!accumulator.TryGetValue(territoryId, out var borders))
        {
            borders = [];
            accumulator[territoryId] = borders;
        }

        borders.Add(border);
    }
}
