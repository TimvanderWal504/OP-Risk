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
        Assert.Equal("fortify.noPathBetweenTerritories", result.Errors.Single().Code);
    }

    [Fact]
    public void Verplaatsing_NaarNietAangrenzendEigenGebiedZonderPad_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("brazil", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "brazil", armiesToMove: 2);

        Assert.False(result.IsSuccess);
        Assert.Equal("fortify.noPathBetweenTerritories", result.Errors.Single().Code);
    }

    [Fact]
    public void Verplaatsing_MetAlleLegersUitBrongebied_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "alberta", armiesToMove: 3);

        Assert.False(result.IsSuccess);
        Assert.Equal("fortify.mustLeaveOneArmyBehind", result.Errors.Single().Code);
    }

    [Fact]
    public void Verplaatsing_AlsErAlDezeFaseVerplaatstIs_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 1));
        state = state.WithTurnState(state.TurnState! with { HasFortified = true });

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "alberta", armiesToMove: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("fortify.alreadyMoved", result.Errors.Single().Code);
    }

    [Fact]
    public void Verplaatsing_VanGebiedNaarZichzelf_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "alaska", armiesToMove: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("fortify.sourceAndTargetMustDiffer", result.Errors.Single().Code);
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
        Assert.Equal("fortify.noPathBetweenTerritories", result.Errors.Single().Code);
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
    public void Verplaatsing_VanuitAfgeslotenGebied_IsOngeldig()
    {
        var effect = new ActiveEffect(
            new TerritoryLockedEffect("aardbeving", EffectDuration.OneRound, ["alaska"]), RoundsRemaining: 1);

        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify, activeEffects: [effect])
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "alberta", armiesToMove: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("fortify.territoryLocked", result.Errors.Single().Code);
    }

    [Fact]
    public void Verplaatsing_NaarAfgeslotenGebied_IsOngeldig()
    {
        var effect = new ActiveEffect(
            new TerritoryLockedEffect("aardbeving", EffectDuration.OneRound, ["alberta"]), RoundsRemaining: 1);

        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify, activeEffects: [effect])
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "alberta", armiesToMove: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("fortify.territoryLocked", result.Errors.Single().Code);
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
    public void ReachableComponents_MetNietVerbondenEigenGebied_VormtEigenGroep()
    {
        // Zelfde ontkoppeld-scenario als Verplaatsing_NaarNietAangrenzendEigenGebiedZonderPad_IsOngeldig:
        // Alaska en Brazilië zijn allebei van p1, maar er is geen pad van eigen gebieden ertussen.
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("brazil", "p1", 1));

        var components = FortifyGuards.ReachableComponents(state, "p1");

        Assert.Equal(2, components.Count);
        Assert.Contains(components, group => group is ["alaska"]);
        Assert.Contains(components, group => group is ["brazil"]);
    }

    [Fact]
    public void ReachableComponents_MetPadVanMeerdereEigenGebieden_ZittenInDezelfdeGroep()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 1))
            .WithTerritory(new TerritoryOwnership("ontario", "p1", 1))
            .WithTerritory(new TerritoryOwnership("quebec", "p1", 1))
            .WithTerritory(new TerritoryOwnership("brazil", "p1", 1));

        var components = FortifyGuards.ReachableComponents(state, "p1");

        Assert.Equal(2, components.Count);

        var connectedGroup = Assert.Single(components, group => group.Contains("alaska"));
        Assert.Equal(["alaska", "alberta", "ontario", "quebec"], connectedGroup.OrderBy(id => id, StringComparer.Ordinal));

        var isolatedGroup = Assert.Single(components, group => group.Contains("brazil"));
        Assert.Equal(["brazil"], isolatedGroup);
    }

    [Fact]
    public void ReachableComponents_MetVergrendeldGebied_ZitInGeenEnkeleGroep()
    {
        var effect = new ActiveEffect(
            new TerritoryLockedEffect("aardbeving", EffectDuration.OneRound, ["alberta"]), RoundsRemaining: 1);

        var state = TestGame.InProgress(turnPhase: TurnPhase.Fortify, activeEffects: [effect])
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 1));

        var components = FortifyGuards.ReachableComponents(state, "p1");

        // Alberta is locked: hoort in géén enkele groep (kan geen bron of doel zijn, FO §9.2 —
        // "geen Verplaatsen erin of eruit"), niet in een eigen singleton-groep.
        var group = Assert.Single(components);
        Assert.Equal(["alaska"], group);
    }

    [Fact]
    public void ReachableComponents_MetFortifyUpgradeThroughEnemy_VoegtGescheidenGroepenSamen()
    {
        // Congo dient hier alleen om het roleffect te activeren (FO §8: de speler moet het
        // rol-herkomstland bezitten) — er bestaat geen padverbinding tussen Congo (Afrika) en
        // Noord-Amerika in deze kaartdata, met of zonder budget, dus Congo hoort een eigen
        // groep te blijven. Alberta (vijandelijk) is de enige verbinding tussen Alaska en
        // Ontario/Quebec; zonder het roleffect zou Alaska dus ook alleen staan.
        var settings = TestGame.Settings() with { RolesEnabled = true };
        var players = new[] { TestGame.Player("p1", "red", roleId: "safariranger"), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, turnPhase: TurnPhase.Fortify, settings: settings)
            .WithTerritory(new TerritoryOwnership("congo", "p1", 1))
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1))
            .WithTerritory(new TerritoryOwnership("ontario", "p1", 1))
            .WithTerritory(new TerritoryOwnership("quebec", "p1", 1));

        var components = FortifyGuards.ReachableComponents(state, "p1");

        Assert.Equal(2, components.Count);

        var mergedGroup = Assert.Single(components, group => group.Contains("alaska"));
        Assert.Equal(["alaska", "ontario", "quebec"], mergedGroup.OrderBy(id => id, StringComparer.Ordinal));

        var congoGroup = Assert.Single(components, group => group.Contains("congo"));
        Assert.Equal(["congo"], congoGroup);
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
