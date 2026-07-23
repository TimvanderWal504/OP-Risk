namespace RiskGame.Rules.Abstractions;

/// <summary>
/// Toewijzingslogica die op meerdere plekken nodig is (rol- en missietoewijzing,
/// FO §8/§6.1) — hier één keer, in plaats van per aanroeper een eigen trekking.
/// </summary>
public static class RandomSourceExtensions
{
    /// <summary>
    /// Kiest <paramref name="count"/> willekeurige, unieke items uit <paramref name="items"/>
    /// (partiële Fisher-Yates) — precies zoveel trekkingen als er items gevraagd zijn, niet
    /// de hele pool doorschudden. Belangrijk voor testbaarheid: een pool van 15 rollen voor
    /// 2 spelers kost zo 2 dobbelaanroepen, geen 14.
    /// </summary>
    public static IReadOnlyList<T> PickRandomSubset<T>(this IRandomSource random, IReadOnlyList<T> items, int count)
    {
        ArgumentNullException.ThrowIfNull(random);
        ArgumentNullException.ThrowIfNull(items);
        ArgumentOutOfRangeException.ThrowIfNegative(count);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(count, items.Count);

        var pool = items.ToList();
        var picked = new List<T>(count);

        for (var i = 0; i < count; i++)
        {
            var j = random.Next(i, pool.Count);
            (pool[i], pool[j]) = (pool[j], pool[i]);
            picked.Add(pool[i]);
        }

        return picked;
    }
}
