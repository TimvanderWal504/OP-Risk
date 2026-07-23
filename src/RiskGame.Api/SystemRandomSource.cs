using RiskGame.Rules.Abstractions;

namespace RiskGame.Api;

/// <summary>
/// Productie-implementatie van <see cref="IRandomSource"/> (TO §4.2): server-side dobbelen
/// via <see cref="Random.Shared"/>, thread-safe voor gelijktijdige spellen.
/// </summary>
public sealed class SystemRandomSource : IRandomSource
{
    public int Next(int minInclusive, int maxExclusive) => Random.Shared.Next(minInclusive, maxExclusive);
}
