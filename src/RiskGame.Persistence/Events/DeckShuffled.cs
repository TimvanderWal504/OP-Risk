namespace RiskGame.Persistence.Events;

/// <summary>
/// De trekstapel is (opnieuw) geschud (FO §4.4): bij spelstart het volledige deck van de
/// kaartvariant, tijdens het spel de afgelegde kaarten zodra de trekstapel leegraakt. Eén
/// event voor beide gevallen — het feit is in beide gevallen hetzelfde ("dit is nu de
/// trekstapel, in deze volgorde"), alleen de herkomst van <paramref name="CardIds"/> verschilt
/// aan de kant van de command handler.
/// </summary>
/// <param name="CardIds">
/// De kaart-id's in geschudde volgorde, al bepaald vóórdat dit event ontstaat (via
/// <see cref="RiskGame.Rules.Abstractions.RandomSourceExtensions.PickRandomSubset{T}"/>),
/// zodat de projectie alleen nog vouwt en niet zelf dobbelt (src/CLAUDE.md, event
/// sourcing-kaders) — een replay levert daardoor altijd dezelfde trekstapel-volgorde op.
/// Kaarten die op dit moment in een hand of nog op de aflegstapel zitten staan hier niet
/// tussen: alleen wat vanaf nu de trekstapel vormt.
/// </param>
public sealed record DeckShuffled(string GameId, IReadOnlyList<string> CardIds);
