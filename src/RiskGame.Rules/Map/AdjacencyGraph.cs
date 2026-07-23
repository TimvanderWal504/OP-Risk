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

    /// <summary>
    /// Bestaat er een aaneengesloten pad van <paramref name="from"/> naar <paramref name="to"/>
    /// via uitsluitend gebieden waarvoor <paramref name="isTraversable"/> waar oplevert
    /// (TO §3.3, "moderne" Fortify — niet beperkt tot directe buren)? <paramref name="to"/>
    /// zelf moet ook traversable zijn. <paramref name="isBorderBlocked"/> filtert grenzen weg,
    /// bijvoorbeeld zeeroutes onder een actief <see cref="Effects.ISeaRouteBlockingEffect"/>.
    /// </summary>
    public bool HasPath(
        string from,
        string to,
        Func<string, bool> isTraversable,
        Func<Border, bool>? isBorderBlocked = null)
    {
        ArgumentNullException.ThrowIfNull(isTraversable);

        if (from == to)
        {
            return true;
        }

        var visited = new HashSet<string>(StringComparer.Ordinal) { from };
        var queue = new Queue<string>();
        queue.Enqueue(from);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();

            foreach (var border in Borders(current))
            {
                if (isBorderBlocked?.Invoke(border) == true)
                {
                    continue;
                }

                var neighbour = Other(border, current);

                if (!visited.Add(neighbour) || !isTraversable(neighbour))
                {
                    continue;
                }

                if (neighbour == to)
                {
                    return true;
                }

                queue.Enqueue(neighbour);
            }
        }

        return false;
    }

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
