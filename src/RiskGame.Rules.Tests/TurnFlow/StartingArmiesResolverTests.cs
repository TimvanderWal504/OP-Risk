using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;

namespace RiskGame.Rules.Tests;

public sealed class StartingArmiesResolverTests
{
    private static GameState StateWith(int playerCount)
    {
        var map = Standaard43Data.Load();
        var players = Enumerable.Range(0, playerCount).Select(i => TestGame.Player($"p{i}", "red")).ToArray();

        return new GameState(
            gameId: "test-game",
            map,
            GamePhase.InProgress,
            TestGame.Settings(),
            players,
            territories: [],
            turnOrder: [],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);
    }

    private static int PresetValue(int playerCount)
    {
        var state = StateWith(playerCount);

        return state.Map.StartingArmiesPresets
            .Single(preset => preset.Id == state.Settings.StartingArmiesPresetId)
            .ArmiesByPlayerCount[playerCount];
    }

    [Fact]
    public void TryResolve_SpelersaantalUitHetPreset_GeeftDeStartlegers() =>
        Assert.Equal(PresetValue(3), StartingArmiesResolver.TryResolve(StateWith(3)));

    [Fact]
    public void TryResolve_SpelersaantalBuitenHetPreset_GeeftNull() =>
        Assert.Null(StartingArmiesResolver.TryResolve(StateWith(1)));

    [Fact]
    public void Resolve_SpelersaantalBuitenHetPreset_IsEenFout() =>
        Assert.Throws<InvalidOperationException>(() => StartingArmiesResolver.Resolve(StateWith(1)));
}
