using RiskGame.Rules.Effects;

namespace RiskGame.Rules.Tests;

public class EventDeckCalculatorTests
{
    private static readonly IReadOnlyList<EventDefinition> Events = Standaard43Data.Load().Events;

    [Fact]
    public void VolleStapel_TrektDeBovensteKaartZonderTeSchudden()
    {
        // Een lege reeks: elke vraag om toeval laat de test falen.
        var draw = EventDeckCalculator.Draw(["griepgolf", "babyboom"], Events, new FixedRandomSource());

        Assert.Null(draw.ShuffledOrder);
        Assert.Equal("griepgolf", draw.EventId);
    }

    [Fact]
    public void LegeStapel_SchudtAlleKaartenEnTrektDeEerste()
    {
        // Fisher-Yates vraagt per plek i een index in [i, n): de eerste keuze is 3, daarna blijft
        // elke kaart staan. De vierde kaart komt dus bovenop.
        var random = new FixedRandomSource([3, .. Enumerable.Range(1, Events.Count - 1)]);

        var draw = EventDeckCalculator.Draw([], Events, random);

        Assert.NotNull(draw.ShuffledOrder);
        Assert.Equal(
            Events.Select(definition => definition.Id).Order(),
            draw.ShuffledOrder!.Order());
        Assert.Equal(Events[3].Id, draw.EventId);
        Assert.Equal(draw.ShuffledOrder![0], draw.EventId);
        Assert.Equal(0, random.Remaining);
    }

    [Fact]
    public void KaartvariantZonderGebeurtenissen_IsEenBug()
    {
        Assert.Throws<InvalidOperationException>(() => EventDeckCalculator.Draw([], [], new FixedRandomSource()));
    }
}
