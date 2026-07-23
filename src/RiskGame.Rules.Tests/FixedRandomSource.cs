using RiskGame.Rules.Abstractions;

namespace RiskGame.Rules.Tests;

/// <summary>
/// Een <see cref="IRandomSource"/> die een vooraf bepaalde reeks teruggeeft, zodat
/// dobbeluitkomsten in tests exact vastliggen (TO §9). De waarden worden op de gevraagde
/// band geprojecteerd, zodat een reeks bruikbaar blijft ongeacht welk bereik de engine
/// vraagt.
/// </summary>
internal sealed class FixedRandomSource(params int[] values) : IRandomSource
{
    private int _index;

    /// <summary>Hoeveel waarden er nog niet zijn opgevraagd.</summary>
    public int Remaining => values.Length - _index;

    public int Next(int minInclusive, int maxExclusive)
    {
        if (maxExclusive <= minInclusive)
        {
            throw new ArgumentOutOfRangeException(
                nameof(maxExclusive), maxExclusive, "maxExclusive moet groter zijn dan minInclusive.");
        }

        if (_index >= values.Length)
        {
            throw new InvalidOperationException(
                "De vaste reeks is op: de code vroeg meer willekeur dan de test verwacht had.");
        }

        var value = values[_index++];

        if (value < minInclusive || value >= maxExclusive)
        {
            throw new InvalidOperationException(
                $"Vaste waarde {value} valt buiten het gevraagde bereik [{minInclusive}, {maxExclusive}).");
        }

        return value;
    }
}
