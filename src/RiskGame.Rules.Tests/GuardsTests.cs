using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Tests;

public class GuardsTests
{
    [Fact]
    public void DeSpelerAanDeBeurt_MagHandelen()
    {
        var state = TestGame.InProgress();

        Assert.True(Guards.IsActivePlayer(state, "p1").IsSuccess);
    }

    [Fact]
    public void EenSpelerDieNietAanDeBeurtIs_MagNietHandelen()
    {
        var state = TestGame.InProgress();

        var result = Guards.IsActivePlayer(state, "p2");

        Assert.False(result.IsSuccess);
        Assert.Contains("niet aan de beurt", result.Errors.Single());
    }

    [Fact]
    public void EenUitgeschakeldeSpelerAanDeBeurt_MagNietHandelen()
    {
        var state = TestGame.InProgress(
            [TestGame.Player("p1", "red", isEliminated: true), TestGame.Player("p2", "blue")]);

        Assert.False(Guards.IsActivePlayer(state, "p1").IsSuccess);
    }

    [Fact]
    public void EenOnbekendeSpeler_MagNietHandelen()
    {
        var state = TestGame.InProgress();

        var result = Guards.IsActivePlayer(state, "p9");

        Assert.False(result.IsSuccess);
        Assert.Contains("Onbekende speler", result.Errors.Single());
    }

    [Fact]
    public void IsNotEliminated_OnderscheidtUitgeschakeldVanMeespelend()
    {
        var state = TestGame.InProgress(
            [TestGame.Player("p1", "red"), TestGame.Player("p2", "blue", isEliminated: true)]);

        Assert.True(Guards.IsNotEliminated(state, "p1").IsSuccess);
        Assert.False(Guards.IsNotEliminated(state, "p2").IsSuccess);
    }

    [Fact]
    public void IsInPhase_LaatAlleenDeJuisteSpelfaseToe()
    {
        var state = TestGame.InProgress();

        Assert.True(Guards.IsInPhase(state, GamePhase.InProgress).IsSuccess);
        Assert.False(Guards.IsInPhase(state, GamePhase.Lobby).IsSuccess);
    }

    [Fact]
    public void IsInTurnPhase_LaatAlleenDeJuisteBeurtfaseToe()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack);

        Assert.True(Guards.IsInTurnPhase(state, TurnPhase.Attack).IsSuccess);
        Assert.False(Guards.IsInTurnPhase(state, TurnPhase.Fortify).IsSuccess);
    }

    [Fact]
    public void IsInTurnPhase_ZonderLopendeBeurt_Faalt()
    {
        var state = TestGame.InProgress().WithTurnState(null);

        var result = Guards.IsInTurnPhase(state, TurnPhase.Reinforce);

        Assert.False(result.IsSuccess);
        Assert.Contains("geen beurt", result.Errors.Single());
    }

    [Fact]
    public void TerritoryExists_KentAlleenDeGebiedenVanDeKaartvariant()
    {
        var state = TestGame.InProgress();

        Assert.True(Guards.TerritoryExists(state, "kamchatka").IsSuccess);
        Assert.False(Guards.TerritoryExists(state, "atlantis").IsSuccess);
    }

    [Fact]
    public void OwnsTerritory_LaatAlleenDeEigenaarToe()
    {
        var state = TestGame.InProgress()
            .WithTerritory(new TerritoryOwnership("brazil", "p1", 3));

        Assert.True(Guards.OwnsTerritory(state, "p1", "brazil").IsSuccess);
        Assert.False(Guards.OwnsTerritory(state, "p2", "brazil").IsSuccess);
    }

    [Fact]
    public void OwnsTerritory_OpEenOnbezetGebied_Faalt()
    {
        var state = TestGame.InProgress();

        Assert.False(Guards.OwnsTerritory(state, "p1", "brazil").IsSuccess);
    }

    [Fact]
    public void OwnsTerritory_MeldtEenOnbekendGebiedAlsZodanig()
    {
        var state = TestGame.InProgress();

        var result = Guards.OwnsTerritory(state, "p1", "atlantis");

        Assert.False(result.IsSuccess);
        Assert.Contains("Onbekend gebied", result.Errors.Single());
    }

    [Fact]
    public void Combine_VerzameltAlleFoutenTegelijk()
    {
        // Een speler moet in één keer zien wat er allemaal mis is, niet fout voor fout.
        var state = TestGame.InProgress();

        var result = ValidationResult.Combine(
            Guards.IsActivePlayer(state, "p2"),
            Guards.TerritoryExists(state, "atlantis"),
            Guards.IsInPhase(state, GamePhase.Lobby));

        Assert.False(result.IsSuccess);
        Assert.Equal(3, result.Errors.Count);
    }

    [Fact]
    public void Combine_ZonderFouten_Slaagt()
    {
        var state = TestGame.InProgress();

        var result = ValidationResult.Combine(
            Guards.IsActivePlayer(state, "p1"),
            Guards.IsInPhase(state, GamePhase.InProgress));

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Errors);
    }
}
