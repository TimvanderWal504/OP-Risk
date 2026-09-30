using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Tests.Validation;

public class AutoPassGuardsTests
{
    private static GameState DrieSpelers(
        bool p1Eliminated = false, bool p2Eliminated = false, bool p3AutoPass = false) =>
        TestGame.InProgress(players:
        [
            TestGame.Player("p1", "red", isHost: true, isEliminated: p1Eliminated),
            TestGame.Player("p2", "blue", isEliminated: p2Eliminated),
            TestGame.Player("p3", "green", isAutoPass: p3AutoPass),
        ]);

    [Fact]
    public void AutoPass_DeHostZetEenAndereSpeler_IsGeldig()
    {
        var result = AutoPassGuards.CanSetAutoPass(DrieSpelers(), "p1", "p2");

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void AutoPass_DoorEenSpelerDieGeenHostIs_IsOngeldig()
    {
        var result = AutoPassGuards.CanSetAutoPass(DrieSpelers(), "p2", "p3");

        Assert.Equal("lobby.notHost", result.Errors.Single().Code);
    }

    [Fact]
    public void AutoPass_OpDeHostZelf_IsOngeldig()
    {
        var result = AutoPassGuards.CanSetAutoPass(DrieSpelers(), "p1", "p1");

        Assert.Equal("autoPass.cannotTargetHost", result.Errors.Single().Code);
    }

    [Fact]
    public void AutoPass_OpEenUitgeschakeldeSpeler_IsOngeldig()
    {
        var result = AutoPassGuards.CanSetAutoPass(DrieSpelers(p2Eliminated: true), "p1", "p2");

        Assert.Equal("common.playerEliminated", result.Errors.Single().Code);
    }

    [Fact]
    public void AutoPass_OpEenSpelerDieAlOpAutoPassStaat_IsOngeldig()
    {
        var result = AutoPassGuards.CanSetAutoPass(DrieSpelers(p3AutoPass: true), "p1", "p3");

        Assert.Equal("autoPass.alreadyAutoPass", result.Errors.Single().Code);
    }

    /// <summary>FO §11.2: alleen tijdens het spel, niet in de startopstelling.</summary>
    [Fact]
    public void AutoPass_BuitenHetSpel_IsOngeldig()
    {
        var state = DrieSpelers().WithPhase(GamePhase.InitialPlacement);

        var result = AutoPassGuards.CanSetAutoPass(state, "p1", "p2");

        Assert.Equal("common.wrongPhase", result.Errors.Single().Code);
    }

    /// <summary>
    /// FO §11.2: niet als daarna niemand zonder auto-pass overblijft. Alleen bereikbaar met een
    /// uitgeschakelde host — een host die meespeelt telt zelf altijd mee.
    /// </summary>
    [Fact]
    public void AutoPass_OpDeLaatsteSpelerZonderAutoPass_IsOngeldig()
    {
        var state = DrieSpelers(p1Eliminated: true, p3AutoPass: true);

        var result = AutoPassGuards.CanSetAutoPass(state, "p1", "p2");

        Assert.Equal("autoPass.noPlayerLeft", result.Errors.Single().Code);
    }
}
