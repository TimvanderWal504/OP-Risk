using RiskGame.Rules.Effects;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class EventBonusCalculatorTests
{
    private static readonly string[] AustraliaTerritories =
        ["indonesia", "new-guinea", "western-australia", "eastern-australia", "new-zealand"];

    private static GameState MetAustralieVoorP1(IReadOnlyList<Player>? players = null)
    {
        var state = TestGame.InProgress(players: players);

        foreach (var territoryId in AustraliaTerritories)
        {
            state = state.WithTerritory(new TerritoryOwnership(territoryId, "p1", 1));
        }

        return state;
    }

    [Fact]
    public void GoedeOogst_GeeftAlleenContinentbezittersDeBonus()
    {
        var bonuses = EventBonusCalculator.BonusesAtDraw(MetAustralieVoorP1(), Standaard43Data.EventEffect("goede-oogst"));

        Assert.Equal(new Dictionary<string, int> { ["p1"] = 2 }, bonuses);
    }

    [Fact]
    public void Babyboom_GeeftIedereenDeBonus()
    {
        var bonuses = EventBonusCalculator.BonusesAtDraw(TestGame.InProgress(), Standaard43Data.EventEffect("babyboom"));

        Assert.Equal(new Dictionary<string, int> { ["p1"] = 2, ["p2"] = 2 }, bonuses);
    }

    [Fact]
    public void UitgeschakeldeSpeler_KrijgtGeenBonus()
    {
        var players = new[]
        {
            TestGame.Player("p1", "red"),
            TestGame.Player("p2", "blue"),
            TestGame.Player("p3", "green", isEliminated: true),
        };

        var bonuses = EventBonusCalculator.BonusesAtDraw(
            TestGame.InProgress(players: players), Standaard43Data.EventEffect("babyboom"));

        Assert.DoesNotContain("p3", bonuses.Keys);
    }

    [Fact]
    public void EffectZonderBonus_LevertNiemandIetsOp()
    {
        var bonuses = EventBonusCalculator.BonusesAtDraw(
            MetAustralieVoorP1(), Standaard43Data.EventEffect("stormachtige-zeeen"));

        Assert.Empty(bonuses);
    }
}
