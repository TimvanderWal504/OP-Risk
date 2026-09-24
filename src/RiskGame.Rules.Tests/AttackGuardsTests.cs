using RiskGame.Rules.Combat;
using RiskGame.Rules.Effects;
using RiskGame.Rules.Map;
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
        Assert.Contains(result.Errors, error => error.Code == "attack.notEnoughArmiesToAttack");
    }

    [Fact]
    public void Aanval_OpNietAangrenzendGebied_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("iceland", "p2", 1));

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "iceland", attackDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.notAdjacent", result.Errors.Single().Code);
    }

    [Fact]
    public void Aanval_OpEigenGebied_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p1", 2));

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "alberta", attackDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.notEnemyTerritory", result.Errors.Single().Code);
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
        Assert.Equal("attack.tooManyAttackDice", result.Errors.Single().Code);
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
                pendingCombat: new PendingCombat("alaska", "alberta", AttackDice: 1, AttackerRolls: [4], AwaitingRerollDecision: false, CorrelationId: Guid.NewGuid()))
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1));

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "alberta", attackDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.combatInProgress", result.Errors.Single().Code);
    }

    [Fact]
    public void Meeverplaatsen_MetMinderLegersDanGebruikteDobbelstenen_IsOngeldig()
    {
        var state = AlaskaVsAlberta(alaskaArmies: 4);

        var result = AttackGuards.CanMoveAfterConquest(
            state, "p1", "alaska", attackDiceUsed: 2, armiesToMove: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.notEnoughArmiesMoved", result.Errors.Single().Code);
    }

    [Fact]
    public void Meeverplaatsen_MetAlleLegersUitBrongebied_IsOngeldig()
    {
        var state = AlaskaVsAlberta(alaskaArmies: 4);

        var result = AttackGuards.CanMoveAfterConquest(
            state, "p1", "alaska", attackDiceUsed: 2, armiesToMove: 4);

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.mustLeaveOneArmyBehind", result.Errors.Single().Code);
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
    public void AndereAanvalAfbreken_MetBevrorenBelegeringEnGeenLopendGevecht_IsGeldig()
    {
        var state = TestGame.InProgress(
            turnPhase: TurnPhase.Attack,
            pausedAttackTarget: new AttackEngagement("alaska", "alberta"));

        var result = AttackGuards.CanAbandonAttack(state, "p1");

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void AndereAanvalAfbreken_ZonderBevrorenBelegering_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack);

        var result = AttackGuards.CanAbandonAttack(state, "p1");

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.noAttackToAbandon", result.Errors.Single().Code);
    }

    [Fact]
    public void AndereAanvalAfbreken_TerwijlErNogEenGevechtLoopt_IsOngeldig()
    {
        var state = TestGame.InProgress(
            turnPhase: TurnPhase.Attack,
            pendingCombat: new PendingCombat("alaska", "alberta", AttackDice: 1, AttackerRolls: [4], AwaitingRerollDecision: false, CorrelationId: Guid.NewGuid()),
            pausedAttackTarget: new AttackEngagement("alaska", "alberta"));

        var result = AttackGuards.CanAbandonAttack(state, "p1");

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.combatInProgress", result.Errors.Single().Code);
    }

    [Fact]
    public void AndereAanvalAfbreken_DoorNietDeActieveSpeler_IsOngeldig()
    {
        var state = TestGame.InProgress(
            turnPhase: TurnPhase.Attack,
            pausedAttackTarget: new AttackEngagement("alaska", "alberta"));

        var result = AttackGuards.CanAbandonAttack(state, "p2");

        Assert.False(result.IsSuccess);
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
        Assert.Equal("attack.routeBlocked", result.Errors.Single().Code);
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
        Assert.Equal("attack.territoryLocked", result.Errors.Single().Code);
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
        Assert.Equal("attack.territoryLocked", result.Errors.Single().Code);
    }

    private static GameState PendingAlaskaVsAlberta(int albertaArmies = 2) =>
        TestGame.InProgress(
                turnPhase: TurnPhase.Attack,
                pendingCombat: new PendingCombat("alaska", "alberta", AttackDice: 2, AttackerRolls: [5, 3], AwaitingRerollDecision: false, CorrelationId: Guid.NewGuid()))
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
    public void Verdedigen_InEenAfgelopenSpel_IsOngeldig()
    {
        var state = PendingAlaskaVsAlberta(albertaArmies: 2).WithPhase(GamePhase.Finished);

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 2);

        Assert.False(result.IsSuccess);
        Assert.Equal("common.gameFinished", result.Errors.Single().Code);
    }

    [Fact]
    public void Verdedigen_MetTweeDobbelstenenBijEenLeger_IsOngeldig()
    {
        var state = PendingAlaskaVsAlberta(albertaArmies: 1);

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 2);

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.mustDefendWithOneDie", result.Errors.Single().Code);
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
        Assert.Equal("attack.invalidDefenseDiceCount", result.Errors.Single().Code);
    }

    [Fact]
    public void Verdedigen_DoorNietDeVerdediger_IsOngeldig()
    {
        var state = PendingAlaskaVsAlberta();

        var result = AttackGuards.CanChooseDefenseDice(state, "p1", defenseDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.notTheDefender", result.Errors.Single().Code);
    }

    [Fact]
    public void Verdedigen_ZonderLopendGevecht_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 2));

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.noCombatToDefend", result.Errors.Single().Code);
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

    [Fact]
    public void Verdedigen_ZolangDeHerwerpBeslissingOpenStaat_IsOngeldig()
    {
        var state = TestGame.InProgress(
                turnPhase: TurnPhase.Attack,
                pendingCombat: new PendingCombat("alaska", "alberta", AttackDice: 2, AttackerRolls: [5, 3], AwaitingRerollDecision: true, CorrelationId: Guid.NewGuid()))
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 2));

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.awaitingRerollDecision", result.Errors.Single().Code);
    }

    private static GameState AlaskaVsAlbertaMetOpenHerwerp() =>
        TestGame.InProgress(
                turnPhase: TurnPhase.Attack,
                pendingCombat: new PendingCombat("alaska", "alberta", AttackDice: 2, AttackerRolls: [5, 3], AwaitingRerollDecision: true, CorrelationId: Guid.NewGuid()))
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 2));

    [Fact]
    public void Herwerpen_MetOpenBeslissing_IsGeldig()
    {
        var state = AlaskaVsAlbertaMetOpenHerwerp();

        var result = AttackGuards.CanRerollAttackDie(state, "p1", dieIndex: 1);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Herwerpen_ZonderOpenBeslissing_IsOngeldig()
    {
        var state = PendingAlaskaVsAlberta(); // AwaitingRerollDecision: false

        var result = AttackGuards.CanRerollAttackDie(state, "p1", dieIndex: 0);

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.noRerollDecisionOpen", result.Errors.Single().Code);
    }

    [Fact]
    public void Herwerpen_DoorNietDeAanvaller_IsOngeldig()
    {
        var state = AlaskaVsAlbertaMetOpenHerwerp();

        var result = AttackGuards.CanRerollAttackDie(state, "p2", dieIndex: 0);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void Herwerpen_MetOngeldigeDobbelsteenIndex_IsOngeldig()
    {
        var state = AlaskaVsAlbertaMetOpenHerwerp(); // 2 dobbelstenen: index 0-1 geldig

        var result = AttackGuards.CanRerollAttackDie(state, "p1", dieIndex: 2);

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.invalidRerollDieIndex", result.Errors.Single().Code);
    }

    [Fact]
    public void Doorgaan_MetOpenBeslissing_IsGeldig()
    {
        var state = AlaskaVsAlbertaMetOpenHerwerp();

        var result = AttackGuards.CanKeepAttackDice(state, "p1");

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Doorgaan_ZonderOpenBeslissing_IsOngeldig()
    {
        var state = PendingAlaskaVsAlberta();

        var result = AttackGuards.CanKeepAttackDice(state, "p1");

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.noRerollDecisionOpen", result.Errors.Single().Code);
    }

    /// <summary>Plan-rollen A7/A8: rolboost-herwerp is per doelgebied per beurt, "Doorgaan"
    /// verbruikt niets, en een ander doelgebied heeft zijn eigen, onafhankelijke herwerp.</summary>
    private static GameState AlaskaVsAlbertaMetRol(
        string roleId, IReadOnlyList<string>? rerolledTargetTerritoryIds = null, string roleOriginTerritoryOwner = "p1")
    {
        var settings = TestGame.Settings() with { RolesEnabled = true };
        var players = new[] { TestGame.Player("p1", "red", roleId: roleId), TestGame.Player("p2", "blue") };

        var state = TestGame.InProgress(players: players, turnPhase: TurnPhase.Attack, settings: settings)
            .WithTerritory(new TerritoryOwnership("china", roleOriginTerritoryOwner, 1))
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1))
            .WithTerritory(new TerritoryOwnership("ontario", "p2", 1));

        return state.WithTurnState(
            state.TurnState! with { RerolledTargetTerritoryIds = rerolledTargetTerritoryIds ?? [] });
    }

    [Fact]
    public void RerollAvailable_MetActieveRolEnNogNietHerworpenDoelgebied_IsWaar()
    {
        var state = AlaskaVsAlbertaMetRol("generaal");

        Assert.True(AttackGuards.RerollAvailable(state, "p1", "alberta"));
    }

    [Fact]
    public void RerollAvailable_ZonderActieveRol_IsOnwaar()
    {
        var state = AlaskaVsAlbertaMetRol("generaal", roleOriginTerritoryOwner: "p2");

        Assert.False(AttackGuards.RerollAvailable(state, "p1", "alberta"));
    }

    [Fact]
    public void RerollAvailable_MetAlHerworpenDoelgebied_IsOnwaar_OokNaEenTussentijdseAanvalElders()
    {
        // "alberta" is deze beurt al herworpen (bv. via een eerdere worp tegen dat doelwit); een
        // tussentijdse aanval op "ontario" verandert daar niets aan — A7 is per doelgebied.
        var state = AlaskaVsAlbertaMetRol("generaal", rerolledTargetTerritoryIds: ["alberta"]);

        Assert.False(AttackGuards.RerollAvailable(state, "p1", "alberta"));
    }

    [Fact]
    public void RerollAvailable_AnderDoelgebiedDatNogNietHerworpenIs_IsWaar()
    {
        var state = AlaskaVsAlbertaMetRol("generaal", rerolledTargetTerritoryIds: ["alberta"]);

        Assert.True(AttackGuards.RerollAvailable(state, "p1", "ontario"));
    }

    [Fact]
    public void RerollAvailable_NieuweBeurt_RerolledTargetsZijnLeeg()
    {
        // Simuleert PhaseChanged's vouwregel: een gloednieuwe TurnState (nooit een `with` op de
        // oude), dus RerolledTargetTerritoryIds is weer leeg — schone lei (plan-rollen C1).
        var state = AlaskaVsAlbertaMetRol("generaal", rerolledTargetTerritoryIds: ["alberta"]);
        state = state.WithTurnState(new TurnState(
            "p1", TurnPhase.Attack, state.TurnState!.Timer, PendingCombat: null));

        Assert.True(AttackGuards.RerollAvailable(state, "p1", "alberta"));
    }

    /// <summary>
    /// FO §5.3 stap 4 / §8.1: "alaska" (p1) valt met <paramref name="attackDice"/> aan op "alberta"
    /// (p2, 3 legers). p2 is "capoeirista" (DefenseBoost, herkomstland "brazil").
    /// </summary>
    private static GameState DefenseBoostScenario(
        int attackDice = 1,
        DefenseDiceRule rule = DefenseDiceRule.HouseRule,
        string brazilOwner = "p2",
        bool boostUsed = false)
    {
        var settings = TestGame.Settings() with { RolesEnabled = true, DefenseDiceRule = rule };
        var players = new[]
        {
            TestGame.Player("p1", "red"),
            TestGame.Player("p2", "blue", roleId: "capoeirista") with { DefenseBoostUsed = boostUsed },
        };
        var rolls = Enumerable.Repeat(4, attackDice).ToArray();

        return TestGame.InProgress(
                players: players,
                turnPhase: TurnPhase.Attack,
                settings: settings,
                pendingCombat: new PendingCombat("alaska", "alberta", attackDice, rolls, AwaitingRerollDecision: false, CorrelationId: Guid.NewGuid()))
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 4))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 3))
            .WithTerritory(new TerritoryOwnership("brazil", brazilOwner, 1));
    }

    [Fact]
    public void Verdedigen_HuisregelTegenEenAanvalsdobbelsteen_MetTweeZonderBoost_IsOngeldig()
    {
        var state = DefenseBoostScenario(brazilOwner: "p1");

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 2);

        Assert.False(result.IsSuccess);
        Assert.Equal("attack.mustDefendWithOneDieHouseRule", result.Errors.Single().Code);
    }

    [Fact]
    public void Verdedigen_HuisregelTegenEenAanvalsdobbelsteen_MetEen_IsGeldig()
    {
        var state = DefenseBoostScenario(brazilOwner: "p1");

        Assert.True(AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 1).IsSuccess);
    }

    [Fact]
    public void Verdedigen_HuisregelTegenTweeAanvalsdobbelstenen_MetTwee_IsGeldigZonderBoost()
    {
        var state = DefenseBoostScenario(attackDice: 2, brazilOwner: "p1");

        Assert.True(AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 2).IsSuccess);
        Assert.False(AttackGuards.DefenseBoostRequired(state, defenseDice: 2));
    }

    [Fact]
    public void Verdedigen_KlassiekTegenEenAanvalsdobbelsteen_MetTwee_IsGeldig()
    {
        var state = DefenseBoostScenario(rule: DefenseDiceRule.Classic, brazilOwner: "p1");

        Assert.True(AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 2).IsSuccess);
        Assert.False(AttackGuards.DefenseBoostRequired(state, defenseDice: 2));
    }

    [Fact]
    public void Verdedigen_HuisregelMetBeschikbareBoostIngezet_MetTwee_IsGeldig()
    {
        var state = DefenseBoostScenario();

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 2, useDefenseBoost: true);

        Assert.True(result.IsSuccess);
        Assert.True(AttackGuards.DefenseBoostRequired(state, defenseDice: 2));
    }

    [Fact]
    public void Verdedigen_HuisregelMetBeschikbareBoostNietIngezet_MetTwee_IsOngeldig()
    {
        var state = DefenseBoostScenario();

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 2, useDefenseBoost: false);

        Assert.Equal("attack.mustDefendWithOneDieHouseRule", result.Errors.Single().Code);
    }

    [Fact]
    public void Verdedigen_HuisregelMetAlGebruikteBoost_MetTwee_IsOngeldig()
    {
        var state = DefenseBoostScenario(boostUsed: true);

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 2, useDefenseBoost: true);

        Assert.Equal("attack.mustDefendWithOneDieHouseRule", result.Errors.Single().Code);
    }

    [Fact]
    public void Verdedigen_HuisregelMetInactieveBoost_MetTwee_IsOngeldig()
    {
        // Herkomstland Brazilië is niet (meer) in bezit van de verdediger.
        var state = DefenseBoostScenario(brazilOwner: "p1");

        var result = AttackGuards.CanChooseDefenseDice(state, "p2", defenseDice: 2, useDefenseBoost: true);

        Assert.Equal("attack.mustDefendWithOneDieHouseRule", result.Errors.Single().Code);
    }

    [Fact]
    public void BoostBeschikbaar_BijKlassiek_IsOnwaar()
    {
        var state = DefenseBoostScenario(rule: DefenseDiceRule.Classic);

        Assert.False(AttackGuards.DefenseBoostAvailable(state, "p2"));
    }

    [Fact]
    public void BoostBeschikbaar_BijHuisregelMetActieveOngebruikteRol_IsWaar()
    {
        var state = DefenseBoostScenario();

        Assert.True(AttackGuards.DefenseBoostAvailable(state, "p2"));
        Assert.False(AttackGuards.DefenseBoostAvailable(state, "p1"));
    }

    /// <summary>FO §7 (taak 4): eerst de ≥6-inleg na een eliminatie afhandelen, vóór verder vechten.</summary>
    [Fact]
    public void Aanval_MetZesOfMeerKaartenInHand_IsOngeldig()
    {
        var hand = Enumerable.Range(0, 6).Select(i => new Card($"c{i}", "quebec", "symbol-1")).ToArray();
        var players = new[] { TestGame.Player("p1", "red", hand: hand), TestGame.Player("p2", "blue") };
        var state = TestGame.InProgress(players: players, turnPhase: TurnPhase.Attack)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1));

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "alberta", attackDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("reinforce.mustTradeInCardsFirst", result.Errors.Single().Code);
    }

    /// <summary>Eerst plaatsen, dan verder vechten — ook als de ≥6-vlag zelf al weg is.</summary>
    [Fact]
    public void Aanval_MetOngeplaatsteInlegpool_IsOngeldig()
    {
        var state = TestGame.InProgress(turnPhase: TurnPhase.Attack, armiesRemaining: 3)
            .WithTerritory(new TerritoryOwnership("alaska", "p1", 3))
            .WithTerritory(new TerritoryOwnership("alberta", "p2", 1));

        var result = AttackGuards.CanDeclareAttack(state, "p1", "alaska", "alberta", attackDice: 1);

        Assert.False(result.IsSuccess);
        Assert.Equal("turnFlow.armiesRemaining", result.Errors.Single().Code);
    }
}
