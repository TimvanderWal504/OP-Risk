using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;

namespace RiskGame.Rules.Tests.TurnFlow;

public class EventRoundCalculatorTests
{
    private static GameState DrieSpelers(string activePlayerId, bool eventsEnabled = true, string? eliminatedPlayerId = null)
    {
        var state = TestGame.InProgress(
            players:
            [
                TestGame.Player("p1", "red", isEliminated: eliminatedPlayerId == "p1"),
                TestGame.Player("p2", "blue", isEliminated: eliminatedPlayerId == "p2"),
                TestGame.Player("p3", "green", isEliminated: eliminatedPlayerId == "p3"),
            ],
            settings: TestGame.Settings() with { EventsEnabled = eventsEnabled });

        return state.WithTurnState(state.TurnState! with { ActivePlayerId = activePlayerId });
    }

    [Fact]
    public void BeurtVanDeLaatsteSpeler_SluitDeRondeAf()
    {
        Assert.True(EventRoundCalculator.IsRoundBoundary(DrieSpelers("p3"), nextPlayerId: "p1"));
    }

    [Fact]
    public void BeurtMiddenInDeRonde_IsGeenRondegrens()
    {
        Assert.False(EventRoundCalculator.IsRoundBoundary(DrieSpelers("p1"), nextPlayerId: "p2"));
        Assert.False(EventRoundCalculator.IsRoundBoundary(DrieSpelers("p2"), nextPlayerId: "p3"));
    }

    /// <summary>Is de laatste speler in de volgorde uitgeschakeld, dan sluit de voorlaatste de ronde af.</summary>
    [Fact]
    public void UitgeschakeldeLaatsteSpeler_VerschuiftDeRondegrens()
    {
        var state = DrieSpelers("p2", eliminatedPlayerId: "p3");

        Assert.Equal("p1", TurnOrderCalculator.NextActivePlayerId(state));
        Assert.True(EventRoundCalculator.IsRoundBoundary(state, nextPlayerId: "p1"));
    }

    /// <summary>Is de eerste speler uitgeschakeld, dan begint de nieuwe ronde bij de tweede.</summary>
    [Fact]
    public void UitgeschakeldeEersteSpeler_VerschuiftHetBeginVanDeRonde()
    {
        var state = DrieSpelers("p3", eliminatedPlayerId: "p1");

        Assert.Equal("p2", TurnOrderCalculator.NextActivePlayerId(state));
        Assert.True(EventRoundCalculator.IsRoundBoundary(state, nextPlayerId: "p2"));
    }

    [Fact]
    public void GebeurtenisrondeUit_TrektNooit()
    {
        Assert.False(EventRoundCalculator.DrawsEventCard(DrieSpelers("p3", eventsEnabled: false), nextPlayerId: "p1"));
    }

    [Fact]
    public void GebeurtenisrondeAan_TrektAlleenOpDeRondegrens()
    {
        Assert.True(EventRoundCalculator.DrawsEventCard(DrieSpelers("p3"), nextPlayerId: "p1"));
        Assert.False(EventRoundCalculator.DrawsEventCard(DrieSpelers("p1"), nextPlayerId: "p2"));
    }

    [Fact]
    public void OnbekendeVolgendeSpeler_IsEenBug_GeenTrekking()
    {
        Assert.Throws<InvalidOperationException>(
            () => EventRoundCalculator.IsRoundBoundary(DrieSpelers("p3"), nextPlayerId: "onbekend"));
    }

    [Fact]
    public void ZonderLopendeBeurt_IsEenRondegrensEenBug()
    {
        var state = DrieSpelers("p3").WithTurnState(null);

        Assert.Throws<InvalidOperationException>(() => EventRoundCalculator.IsRoundBoundary(state, "p1"));
    }
}
