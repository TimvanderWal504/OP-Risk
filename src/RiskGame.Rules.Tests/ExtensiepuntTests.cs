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
