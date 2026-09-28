using RiskGame.Rules.Combat;
using RiskGame.Rules.Effects;
using RiskGame.Rules.Fortify;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

/// <summary>
/// De gebeurtenis-effecten zoals ze echt uit events.json komen (FO §9.2), niet via test-dubbels:
/// bewijst dat een getrokken kaart de guards ook daadwerkelijk raakt.
/// </summary>
public class ActiveEffectQueriesTests
{
    private static GameState MetGebeurtenis(string eventId, TurnPhase turnPhase = TurnPhase.Attack) =>
        TestGame.InProgress(turnPhase: turnPhase, activeEffects: [new ActiveEffect(Standaard43Data.EventEffect(eventId))]);

    [Fact]
    public void StormachtigeZeeen_BlokkeertElkeZeeroute()
    {
        var state = MetGebeurtenis("stormachtige-zeeen");

        Assert.True(ActiveEffectQueries.IsBorderBlocked(state, "alaska", "kamchatka"));
        Assert.True(ActiveEffectQueries.IsBorderBlocked(state, "iceland", "greenland"));
    }

    [Fact]
    public void StormachtigeZeeen_LaatLandgrenzenOpen()
    {
        var state = MetGebeurtenis("stormachtige-zeeen");

        Assert.False(ActiveEffectQueries.IsBorderBlocked(state, "alaska", "alberta"));
    }

    [Fact]
    public void BeringstraatDichtgevroren_BlokkeertAlleenDieRoute_InBeideRichtingen()
    {
        var state = MetGebeurtenis("beringstraat-dichtgevroren");

        Assert.True(ActiveEffectQueries.IsBorderBlocked(state, "kamchatka", "alaska"));
        Assert.True(ActiveEffectQueries.IsBorderBlocked(state, "alaska", "kamchatka"));
        Assert.False(ActiveEffectQueries.IsBorderBlocked(state, "iceland", "greenland"));
    }

    [Fact]
    public void ZonderActiefEffect_IsNietsGeblokkeerdOfAfgesloten()
    {
        var state = TestGame.InProgress();

        Assert.False(ActiveEffectQueries.IsBorderBlocked(state, "alaska", "kamchatka"));
        Assert.False(ActiveEffectQueries.IsTerritoryLocked(state, "china"));
        Assert.Null(ActiveEffectQueries.BlockedBorderPredicate(state));
    }

    [Fact]
    public void GrensTussenNietAangrenzendeGebieden_IsNooitGeblokkeerd()
    {
        var state = MetGebeurtenis("stormachtige-zeeen");

        Assert.False(ActiveEffectQueries.IsBorderBlocked(state, "alaska", "china"));
    }

    [Fact]
    public void AardbevingInChina_SluitAlleenChinaAf()
    {
        var state = MetGebeurtenis("aardbeving-in-china");

        Assert.True(ActiveEffectQueries.IsTerritoryLocked(state, "china"));
        Assert.False(ActiveEffectQueries.IsTerritoryLocked(state, "siam"));
    }

    [Fact]
    public void Aanval_OverDeDichtgevrorenBeringstraat_IsOngeldig()
    {
        var state = MetGebeurtenis("beringstraat-dichtgevroren")
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("kamchatka", "p2", 1));

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "kamchatka", attackDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.routeBlocked", result.Errors.Single().Code);
    }

    [Fact]
    public void Verplaatsen_OverDeDichtgevrorenBeringstraat_IsOngeldig()
    {
        var state = MetGebeurtenis("beringstraat-dichtgevroren", TurnPhase.Fortify)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("kamchatka", "p1", 1));

        var result = FortifyGuards.CanFortify(state, "p1", "alaska", "kamchatka", armiesToMove: 1);

        Assert.False(result.IsSuccess);
    }
}
