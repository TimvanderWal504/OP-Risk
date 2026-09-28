using RiskGame.Rules.Abstractions;

namespace RiskGame.Rules.Effects;

/// <summary>
/// Een trekking van de gebeurtenisstapel. <see cref="ShuffledOrder"/> is gevuld als er vóór deze
/// trekking (opnieuw) geschud moest worden, en is dan de volledige nieuwe volgorde — de eerste
/// daarvan is <see cref="EventId"/>.
/// </summary>
public sealed record EventDraw(IReadOnlyList<string>? ShuffledOrder, string EventId);

/// <summary>
/// Trekt gebeurteniskaarten zonder teruglegging (FO §9.2): de stapel wordt geschud, van boven
/// getrokken, en pas als hij op is worden alle kaarten opnieuw geschud. Toeval alleen via
/// <see cref="IRandomSource"/>, en alleen op het moment dat er geschud moet worden.
/// </summary>
public static class EventDeckCalculator
{
    public static EventDraw Draw(
        IReadOnlyList<string> drawPile, IReadOnlyList<EventDefinition> events, IRandomSource random)
    {
        ArgumentNullException.ThrowIfNull(drawPile);
        ArgumentNullException.ThrowIfNull(events);
        ArgumentNullException.ThrowIfNull(random);

        if (drawPile.Count > 0)
        {
            return new EventDraw(ShuffledOrder: null, drawPile[0]);
        }

        if (events.Count == 0)
        {
            throw new InvalidOperationException("Er is geen gebeurteniskaart om te trekken: de kaartvariant heeft geen gebeurtenissen.");
        }

        var shuffled = random.PickRandomSubset(events.Select(definition => definition.Id).ToArray(), events.Count);

        return new EventDraw(shuffled, shuffled[0]);
    }
}
