namespace RiskGame.Api.Tests;

/// <summary>
/// <c>StartGame</c> schudt sinds deze wijziging de volledige trekstapel (FO §4.4) via
/// <c>RandomSourceExtensions.PickRandomSubset</c>: voor een volle Fisher-Yates over de 45
/// kaarten van <c>standaard-43</c> (43 gebieden + 2 jokers) vraagt dat 45
/// <c>IRandomSource.Next</c>-aanroepen, ná een eventuele roltoewijzing en vóór
/// <c>GameStarted</c>. Een test die <see cref="SequenceRandomSource"/> met een vaste, korte
/// reeks gebruikt voor iets ná <c>StartGame</c> (order-roll-dobbelstenen, bijvoorbeeld) moet
/// daarom deze 45 vulwaarden invoegen op de plek waar <c>StartGame</c> ze verbruikt — vóór de
/// eigen vervolgwaarden, ná een eventuele rol-/missietoewijzing.
/// </summary>
public static class DeckShuffleFiller
{
    /// <summary>43 gebiedskaarten + 2 jokers (FO §4.4) — alleen geldig voor <c>standaard-43</c>.</summary>
    public const int Standaard43DeckSize = 45;

    /// <summary>
    /// <c>PickRandomSubset</c> roept <c>Next(i, pool.Count)</c> aan voor <c>i</c> van 0 tot
    /// 44; <c>i</c> zelf valt altijd in dat bereik. Deze reeks levert dus een geldige, geen
    /// enkele kaart verplaatsende ("identiteits-")schudbeurt op — de trekstapel komt na
    /// toepassing overeen met de opbouwvolgorde van het deck. Geen van de tests die dit
    /// gebruiken toetst de kaartvolgorde zelf; ze hebben alleen geldige vulwaarden nodig.
    /// </summary>
    public static int[] Values { get; } = [.. Enumerable.Range(0, Standaard43DeckSize)];
}
