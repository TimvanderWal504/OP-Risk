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

    [Fact]
    public void FortifyUpgrade_ThroughEnemy_MetRolEnHerkomstlandInBezit_StaatPadDoorEenVijandelijkGebiedToe()
    {
        var settings = TestGame.Settings() with { RolesEnabled = true };
        var players = new[] { TestGame.Player("p1", "red", roleId: "safariranger"), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, turnPhase: TurnPhase.Fortify, settings: settings)
            .WithTerritory(new TerritoryOwnership("congo", "p1", 1))
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1))
            .WithTerritory(new TerritoryOwnership("ontario", "p1", 1))
            .WithTerritory(new TerritoryOwnership("quebec", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "quebec", armiesToMove: 2);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void FortifyUpgrade_ThroughEnemy_ZonderHerkomstlandInBezit_StaatPadDoorVijandelijkGebiedNietToe()
    {
        var settings = TestGame.Settings() with { RolesEnabled = true };
        var players = new[] { TestGame.Player("p1", "red", roleId: "safariranger"), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, turnPhase: TurnPhase.Fortify, settings: settings)
            .WithTerritory(new TerritoryOwnership("congo", "p2", 1))
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1))
            .WithTerritory(new TerritoryOwnership("ontario", "p1", 1))
            .WithTerritory(new TerritoryOwnership("quebec", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "quebec", armiesToMove: 2);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void FortifyUpgrade_ThroughEnemy_MetRollenUit_StaatPadDoorVijandelijkGebiedNietToe()
    {
        var players = new[] { TestGame.Player("p1", "red", roleId: "safariranger"), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, turnPhase: TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("congo", "p1", 1))
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1))
            .WithTerritory(new TerritoryOwnership("ontario", "p1", 1))
            .WithTerritory(new TerritoryOwnership("quebec", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "quebec", armiesToMove: 2);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void FortifyUpgrade_ThroughEnemy_BudgetIsMaarEenGebied_TweeVijandelijkeGebiedenBlijftOngeldig()
    {
        // Zuid-Amerika is alleen bereikbaar via de venezuela-bottleneck (geen andere
        // grens tussen central-america en de rest van Zuid-Amerika); met venezuela én
        // brazil/peru allebei vijandelijk kost elke route minimaal 2 niet-eigen gebieden.
        var settings = TestGame.Settings() with { RolesEnabled = true };
        var players = new[] { TestGame.Player("p1", "red", roleId: "safariranger"), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, turnPhase: TurnPhase.Fortify, settings: settings)
            .WithTerritory(new TerritoryOwnership("congo", "p1", 1))
            .WithTerritory(new TerritoryOwnership("central-america", "p1", 3))
            .WithTerritory(new TerritoryOwnership("venezuela", "p2", 1))
            .WithTerritory(new TerritoryOwnership("brazil", "p2", 1))
            .WithTerritory(new TerritoryOwnership("peru", "p2", 1))
            .WithTerritory(new TerritoryOwnership("argentina", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "central-america", "argentina", armiesToMove: 2);

        Assert.False(result.IsSuccess);
    }
}
