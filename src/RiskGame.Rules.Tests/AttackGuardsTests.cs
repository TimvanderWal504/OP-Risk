using RiskGame.Rules.Combat;
using RiskGame.Rules.Effects;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class AttackGuardsTests
{
    private static GameState AlaskaVsAlberta(int alaskaArmies = 3, int albertaArmies = 1) =>
        TestGame.InProgress(turnPhase: TurnPhase.Attack)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", alaskaArmies))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", albertaArmies));

    [Fact]
    public void Aanval_VanuitGebiedMetGenoegLegersOpVijandelijkeBuur_IsGeldig()
    {
        var state = AlaskaVsAlberta();

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "alberta", attackDice: 2);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Aanval_VanuitGebiedMetEenLeger_IsOngeldig()
    {
        var state = AlaskaVsAlberta(alaskaArmies: 1);

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "alberta", attackDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Contains(result.Errors, error => error.Contains("minimaal 2 legers"));
    }

    [Fact]
    public void Aanval_OpNietAangrenzendGebied_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("iceland", "p2", 1));

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "iceland", attackDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Contains("grenst niet aan", result.Errors.Single());
    }

    [Fact]
    public void Aanval_OpEigenGebied_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 2));

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "alberta", attackDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Contains("geen vijandelijk gebied", result.Errors.Single());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(4)]
    public void Aanval_MetOngeldigAantalDobbelstenen_IsOngeldig(int attackDice)
    {
        var state = AlaskaVsAlberta(alaskaArmies: 5);

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "alberta", attackDice);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void Aanval_MetMeerDobbelstenenDanLegersMinEen_IsOngeldig()
    {
        var state = AlaskaVsAlberta(alaskaArmies: 3);

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "alberta", attackDice: 3);

        Assert.False(result.IsSuccess);
        Assert.Contains("mag niet groter zijn dan", result.Errors.Single());
    }

    [Fact]
    public void Aanval_BuitenDeAanvalsfase_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Reinforce)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1));

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "alberta", attackDice: 1);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void Aanval_TerwijlErAlEenGevechtLoopt_IsOngeldig()
    {
        var state = TestGame.InProgress(
                turnPhase: TurnPhase.Attack,
                pendingCombat: new PendingCombat("alaska", "alberta", AttackDice: 1))
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1));

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "alberta", attackDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Contains("loopt al een gevecht", result.Errors.Single());
    }

    [Fact]
    public void Meeverplaatsen_MetMinderLegersDanGebruikteDobbelstenen_IsOngeldig()
    {
        var state = AlaskaVsAlberta(alaskaArmies: 4);

        var result = AttackGuards.CanMoveAfterConquest(
            state, "p1", "alaska", attackDiceUsed: 2, armiesToMove: 1);

        Assert.False(result.IsSuccess);
        Assert.Contains("Minimaal 2 leger(s)", result.Errors.Single());
    }

    [Fact]
    public void Meeverplaatsen_MetAlleLegersUitBrongebied_IsOngeldig()
    {
        var state = AlaskaVsAlberta(alaskaArmies: 4);

        var result = AttackGuards.CanMoveAfterConquest(
            state, "p1", "alaska", attackDiceUsed: 2, armiesToMove: 4);

        Assert.False(result.IsSuccess);
        Assert.Contains("minimaal 1 leger achterblijven", result.Errors.Single());
    }

    [Fact]
    public void Meeverplaatsen_MetGeldigAantal_IsGeldig()
    {
        var state = AlaskaVsAlberta(alaskaArmies: 4);

        var result = AttackGuards.CanMoveAfterConquest(
            state, "p1", "alaska", attackDiceUsed: 2, armiesToMove: 2);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Aanval_OverGeblokkeerdeZeeroute_IsOngeldig()
    {
        var state = TestGame.InProgress(
                turnPhase: TurnPhase.Attack,
                activeEffects: [new ActiveEffect(new FullSeaBlockadeEffect(), RoundsRemaining: 1)])
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("kamchatka", "p2", 1));

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "kamchatka", attackDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Contains("geblokkeerd", result.Errors.Single());
    }

    [Fact]
    public void Aanval_VanuitAfgeslotenGebied_IsOngeldig()
    {
        var effect = new ActiveEffect(
            new TerritoryLockedEffect("aardbeving", EffectDuration.OneRound, ["alaska"]), RoundsRemaining: 1);

        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack, activeEffects: [effect])
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1));

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "alberta", attackDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Contains("afgesloten", result.Errors.Single());
    }

    [Fact]
    public void Aanval_OpAfgeslotenGebied_IsOngeldig()
    {
        var effect = new ActiveEffect(
            new TerritoryLockedEffect("aardbeving", EffectDuration.OneRound, ["alberta"]), RoundsRemaining: 1);

        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack, activeEffects: [effect])
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1));

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "alberta", attackDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Contains("afgesloten", result.Errors.Single());
    }

    private static GameState PendingAlaskaVsAlberta(int albertaArmies = 2) =>
        TestGame.InProgress(
                turnPhase: TurnPhase.Attack,
                pendingCombat: new PendingCombat("alaska", "alberta", AttackDice: 2))
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", albertaArmies));

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    public void Verdedigen_MetGeldigAantalDobbelstenen_IsGeldig(int defenseDice)
    {
        var state = PendingAlaskaVsAlberta(albertaArmies: 2);

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Verdedigen_MetTweeDobbelstenenBijEenLeger_IsOngeldig()
    {
        var state = PendingAlaskaVsAlberta(albertaArmies: 1);

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 2);

        Assert.False(result.IsSuccess);
        Assert.Contains("alleen met 1 dobbelsteen", result.Errors.Single());
    }

    [Fact]
    public void Verdedigen_MetEenDobbelsteenBijEenLeger_IsGeldig()
    {
        var state = PendingAlaskaVsAlberta(albertaArmies: 1);

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 1);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Verdedigen_MetDrieDobbelstenen_IsOngeldig()
    {
        var state = PendingAlaskaVsAlberta(albertaArmies: 3);

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 3);

        Assert.False(result.IsSuccess);
        Assert.Contains("moet 1 of 2 zijn", result.Errors.Single());
    }

    [Fact]
    public void Verdedigen_DoorNietDeVerdediger_IsOngeldig()
    {
        var state = PendingAlaskaVsAlberta();

        var result = AttackGuards.CanChooseDefenseDice(state, "p1", defenseDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Contains("niet de verdediger", result.Errors.Single());
    }

    [Fact]
    public void Verdedigen_ZonderLopendGevecht_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 2));

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Contains("geen gevecht", result.Errors.Single());
    }

    [Fact]
    public void Verdedigen_BuitenDeAanvalsfase_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Reinforce)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 2));

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 1);

        Assert.False(result.IsSuccess);
    }
}
