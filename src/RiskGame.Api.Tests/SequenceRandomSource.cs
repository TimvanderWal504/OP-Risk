using RiskGame.Rules.Abstractions;

namespace RiskGame.Api.Tests;

/// <summary>
/// Test-implementatie van <see cref="IRandomSource"/> die een vooraf bepaalde reeks
/// teruggeeft, zodat een order-roll-scenario (gelijkspel, herworp) end-to-end reproduceerbaar
/// is. Analoog aan <c>FixedRandomSource</c> in <c>RiskGame.Rules.Tests</c>, hier lokaal
/// gehouden omdat het testproject niet naar dat testproject verwijst.
/// </summary>
public sealed class SequenceRandomSource(params int[] values) : IRandomSource
{
    private int _index;

    public int Next(int minInclusive, int maxExclusive)
    {
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
