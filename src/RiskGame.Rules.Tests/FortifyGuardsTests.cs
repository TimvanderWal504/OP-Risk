using RiskGame.Rules.Effects;
using RiskGame.Rules.Fortify;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class FortifyGuardsTests
{
    [Fact]
    public void Verplaatsing_TussenDirecteBuren_IsGeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "alberta", armiesToMove: 2);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Verplaatsing_OverPadVanMeerdereEigenGebieden_IsGeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 1))
            .WithTerritory(new TerritoryOwnership("ontario", "p1", 1))
            .WithTerritory(new TerritoryOwnership("quebec", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "quebec", armiesToMove: 2);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Verplaatsing_OverPadDatDoorVijandelijkGebiedLoopt_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1))
            .WithTerritory(new TerritoryOwnership("ontario", "p1", 1))
            .WithTerritory(new TerritoryOwnership("quebec", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "quebec", armiesToMove: 2);

        Assert.False(result.IsSuccess);
        Assert.Contains("geen aaneengesloten pad", result.Errors.Single());
    }

    [Fact]
    public void Verplaatsing_NaarNietAangrenzendEigenGebiedZonderPad_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("brazil", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "brazil", armiesToMove: 2);

        Assert.False(result.IsSuccess);
        Assert.Contains("geen aaneengesloten pad", result.Errors.Single());
    }

    [Fact]
    public void Verplaatsing_MetAlleLegersUitBrongebied_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "alberta", armiesToMove: 3);

        Assert.False(result.IsSuccess);
        Assert.Contains("minimaal 1 leger achterblijven", result.Errors.Single());
    }

    [Fact]
    public void Verplaatsing_VanGebiedNaarZichzelf_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "alaska", armiesToMove: 1);

        Assert.False(result.IsSuccess);
        Assert.Contains("verschillend zijn", result.Errors.Single());
    }

    [Fact]
    public void Verplaatsing_BuitenDeVerplaatsingsfase_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "alberta", armiesToMove: 1);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void Verplaatsing_OverGeblokkeerdeZeeroute_IsOngeldig()
    {
        var state = TestGame.InProgress(
                turnPhase: TurnPhase.Fortify,
                activeEffects: [new ActiveEffect(new FullSeaBlockadeEffect(), RoundsRemaining: 1)])
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("kamchatka", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "kamchatka", armiesToMove: 1);

        Assert.False(result.IsSuccess);
        Assert.Contains("geen aaneengesloten pad", result.Errors.Single());
    }

    [Fact]
    public void Verplaatsing_OverLandpadOndanksGeblokkeerdeZeeroutes_IsGeldig()
    {
        var state = TestGame.InProgress(
                turnPhase: TurnPhase.Fortify,
                activeEffects: [new ActiveEffect(new FullSeaBlockadeEffect(), RoundsRemaining: 1)])
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "alberta", armiesToMove: 1);

        Assert.True(result.IsSuccess);
    }
}
