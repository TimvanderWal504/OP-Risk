using RiskGame.Rules.Effects;
using RiskGame.Rules.Missions;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

/// <summary>
/// Bewijst dat de extensiepunten voor effecten en missies werken zolang er nog geen
/// content-JSON is (FO §13). De implementaties hieronder zijn test-doubles: rollen,
/// missies en gebeurteniskaarten krijgen hun echte types zodra hun data er is.
/// </summary>
public class ExtensiepuntTests
{
    private sealed record TestEffect(string Id, EffectDuration Duration) : IEffect;

    /// <summary>Het missietype uit FO §6.1: bezit N gebieden.</summary>
    private sealed record TerritoryCountMission(string Id, int Count, bool RequiresOwnTurn)
        : IMission
    {
        public bool IsAchieved(GameState state, string playerId) =>
            state.TerritoriesOf(playerId).Count() >= Count;
    }

    [Fact]
    public void DeStateDraagtActieveEffecten()
    {
        var effect = new TestEffect("goede-oogst", EffectDuration.OneRound);

        var state = TestGame.InProgress(activeEffects: [new ActiveEffect(effect, RoundsRemaining: 1)]);

        var active = Assert.Single(state.ActiveEffects);
        Assert.Equal("goede-oogst", active.Effect.Id);
        Assert.Equal(EffectDuration.OneRound, active.Effect.Duration);
    }

    [Fact]
    public void WithActiveEffects_LaatDeOorspronkelijkeStateOngemoeid()
    {
        var state = TestGame.InProgress();

        var updated = state.WithActiveEffects(
            [new ActiveEffect(new TestEffect("sea-routes-blocked", EffectDuration.OneRound), 1)]);

        Assert.Empty(state.ActiveEffects);
        Assert.Single(updated.ActiveEffects);
    }

    [Fact]
    public void EenSpelerDraagtZijnMissie()
    {
        var mission = new TerritoryCountMission("conquer-24", Count: 24, RequiresOwnTurn: false);

        var state = TestGame.InProgress(
            [TestGame.Player("p1", "red", mission: mission), TestGame.Player("p2", "blue")]);

        Assert.Same(mission, state.Player("p1").Mission);
        Assert.Null(state.Player("p2").Mission);
    }

    [Fact]
    public void EenMissieLeestDeStateZonderDeEngineTeKennen()
    {
        var mission = new TerritoryCountMission("conquer-2", Count: 2, RequiresOwnTurn: false);
        var state = TestGame.InProgress()
            .WithTerritory(new TerritoryOwnership("brazil", "p1", 1));

        Assert.False(mission.IsAchieved(state, "p1"));

        var withSecond = state.WithTerritory(new TerritoryOwnership("peru", "p1", 1));

        Assert.True(mission.IsAchieved(withSecond, "p1"));
    }

    [Fact]
    public void RequiresOwnTurn_WordtGedragenDoorHetType()
    {
        // FO §6.1: dit veld wordt altijd gerespecteerd; de evaluatie ervan volgt later.
        var mission = new TerritoryCountMission("conquer-24", Count: 24, RequiresOwnTurn: true);

        Assert.True(mission.RequiresOwnTurn);
    }

    /// <summary>
    /// Een verzonnen versterkingseffect telt mee zonder dat
    /// <see cref="Rules.Reinforcement.ReinforcementCalculator"/> het type kent — dat is de
    /// Open/Closed-belofte van <see cref="IReinforcementBonusEffect"/> (src/CLAUDE.md).
    /// </summary>
    [Fact]
    public void EenNieuwVersterkingseffect_TeltMeeZonderDeCalculatorTeWijzigen()
    {
        var state = TestGame.InProgress(
            activeEffects: [new ActiveEffect(new TestBonusEffect("mobilisatie", 4), RoundsRemaining: 1)]);

        // Zonder gebieden is de basis het minimum van 3 (FO §5.2); het effect komt daar bovenop.
        Assert.Equal(3 + 4, Rules.Reinforcement.ReinforcementCalculator.CalculateArmies(state, "p1"));
    }

    /// <summary>
    /// De ondergrens van 3 legers hoort bij het gebiedsdeel van de berekening en niet over de
    /// effectensom heen: een effect dat 0 bijdraagt mag het totaal niet naar beneden trekken.
    /// </summary>
    [Fact]
    public void EenEffectDatNietsBijdraagt_LaatDeOndergrensStaan()
    {
        var state = TestGame.InProgress(
            activeEffects: [new ActiveEffect(new TestBonusEffect("windstilte", 0), RoundsRemaining: 1)]);

        Assert.Equal(3, Rules.Reinforcement.ReinforcementCalculator.CalculateArmies(state, "p1"));
    }

    /// <summary>
    /// Idem voor blokkerende effecten: een nieuw type dat <see cref="ITerritoryLockingEffect"/>
    /// implementeert wordt door de guards gezien zonder dat die het type kennen (FO §9.2).
    /// </summary>
    [Fact]
    public void EenNieuwBlokkerendEffect_SluitEenGebiedAfZonderDeGuardsTeWijzigen()
    {
        var state = TestGame.InProgress(
                turnPhase: TurnPhase.Attack,
                activeEffects: [new ActiveEffect(new TestLockEffect("zandstorm", "brazil"), RoundsRemaining: 1)])
            .WithTerritory(new TerritoryOwnership("peru", "p1", 5))
            .WithTerritory(new TerritoryOwnership("brazil", "p2", 1));

        var result = Rules.Combat.AttackGuards.CanDeclareAttack(state, "p1", "peru", "brazil", attackDice: 1);

        // Op de sleutel asserten en niet alleen op "mislukt": anders zou de test ook groen
        // blijven als de aanval om een heel andere reden werd geweigerd.
        Assert.Contains(result.Errors, error => error.Code == "attack.territoryLocked");
    }

    /// <summary>Een bonus-effect dat de engine niet kent; draagt zijn eigen bedrag.</summary>
    private sealed record TestBonusEffect(string Id, int Amount)
        : IEffect, IReinforcementBonusEffect
    {
        public EffectDuration Duration => EffectDuration.OneRound;

        public int BonusFor(GameState state, string playerId) => Amount;
    }

    /// <summary>Een blokkerend effect dat de engine niet kent; sluit één gebied af.</summary>
    private sealed record TestLockEffect(string Id, string LockedTerritoryId)
        : IEffect, ITerritoryLockingEffect
    {
        public EffectDuration Duration => EffectDuration.OneRound;

        public bool IsLocked(string territoryId) => territoryId == LockedTerritoryId;
    }

    [Fact]
    public void DeVasteWillekeurbron_GeeftDeAfgesprokenReeks()
    {
        var random = new FixedRandomSource(6, 3, 1);

        Assert.Equal(6, random.Next(1, 7));
        Assert.Equal(3, random.Next(1, 7));
        Assert.Equal(1, random.Next(1, 7));
        Assert.Equal(0, random.Remaining);
    }

    [Fact]
    public void DeVasteWillekeurbron_KlaagtAlsDeCodeMeerWorpenVraagtDanVerwacht()
    {
        var random = new FixedRandomSource(6);

        random.Next(1, 7);

        Assert.Throws<InvalidOperationException>(() => random.Next(1, 7));
    }
}
