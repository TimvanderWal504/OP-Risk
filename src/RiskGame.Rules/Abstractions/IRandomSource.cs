namespace RiskGame.Rules.Abstractions;

/// <summary>
/// De enige bron van toeval in de engine. Alle worpen en schudbeurten lopen hierlangs,
/// nooit via <see cref="System.Random"/> direct, zodat spellogica met een vaste seed
/// reproduceerbaar is in tests en replays (TO §4.2, §9).
/// </summary>
public interface IRandomSource
{
    /// <summary>Een getal in <c>[minInclusive, maxExclusive)</c>.</summary>
    int Next(int minInclusive, int maxExclusive);
}
