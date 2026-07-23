using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Tests;

public sealed class LobbyGuardsTests
{
    private static GameState LobbyState(IReadOnlyList<Player>? players = null, GamePhase phase = GamePhase.Lobby)
    {
        var map = Standaard43Data.Load();

        return new GameState(
            gameId: "test-game",
            map,
            phase,
            TestGame.Settings(),
            players ?? [],
            territories: [],
            turnOrder: [],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);
    }

    [Fact]
    public void GameIsInLobby_InLobbyfase_IsGeldig() =>
        Assert.True(LobbyGuards.GameIsInLobby(LobbyState()).IsSuccess);

    [Fact]
    public void GameIsInLobby_BuitenLobbyfase_IsOngeldig() =>
        Assert.False(LobbyGuards.GameIsInLobby(LobbyState(phase: GamePhase.InProgress)).IsSuccess);

    [Fact]
    public void ColorIsKnown_BestaandeKleur_IsGeldig() =>
        Assert.True(LobbyGuards.ColorIsKnown(LobbyState(), "red").IsSuccess);

    [Fact]
    public void ColorIsKnown_OnbekendeKleur_IsOngeldig() =>
        Assert.False(LobbyGuards.ColorIsKnown(LobbyState(), "onbekend").IsSuccess);

    [Fact]
    public void ColorIsAvailable_NogNietGekozen_IsGeldig() =>
        Assert.True(LobbyGuards.ColorIsAvailable(LobbyState(), "red").IsSuccess);

    [Fact]
    public void ColorIsAvailable_AlGekozenDoorAndereSpeler_IsOngeldig()
    {
        var state = LobbyState([TestGame.Player("p1", "red")]);

        Assert.False(LobbyGuards.ColorIsAvailable(state, "red").IsSuccess);
    }

    [Fact]
    public void SlotIsAvailable_MinderSpelersDanKleuren_IsGeldig()
    {
        var state = LobbyState([TestGame.Player("p1", "red")]);

        Assert.True(LobbyGuards.SlotIsAvailable(state).IsSuccess);
    }

    [Fact]
    public void SlotIsAvailable_ZoveelSpelersAlsKleuren_IsOngeldig()
    {
        var map = Standaard43Data.Load();
        var players = map.Colors
            .Select((color, index) => TestGame.Player($"p{index}", color.Id))
            .ToArray();
        var state = LobbyState(players);

        Assert.False(LobbyGuards.SlotIsAvailable(state).IsSuccess);
    }

    [Fact]
    public void CallerIsHost_VoorDeHost_IsGeldig()
    {
        var state = LobbyState([TestGame.Player("p1", "red", isHost: true), TestGame.Player("p2", "blue")]);

        Assert.True(LobbyGuards.CallerIsHost(state, "p1").IsSuccess);
    }

    [Fact]
    public void CallerIsHost_VoorNietHost_IsOngeldig()
    {
        var state = LobbyState([TestGame.Player("p1", "red", isHost: true), TestGame.Player("p2", "blue")]);

        Assert.False(LobbyGuards.CallerIsHost(state, "p2").IsSuccess);
    }

    [Fact]
    public void HasMinimumPlayers_MetTweeSpelers_IsGeldig()
    {
        var state = LobbyState([TestGame.Player("p1", "red"), TestGame.Player("p2", "blue")]);

        Assert.True(LobbyGuards.HasMinimumPlayers(state).IsSuccess);
    }

    [Fact]
    public void HasMinimumPlayers_MetEenEnkeleSpeler_IsOngeldig()
    {
        var state = LobbyState([TestGame.Player("p1", "red")]);

        Assert.False(LobbyGuards.HasMinimumPlayers(state).IsSuccess);
    }

    [Fact]
    public void AllPlayersHaveChosenColor_AlsIedereenEenKleurHeeft_IsGeldig()
    {
        var state = LobbyState([TestGame.Player("p1", "red"), TestGame.Player("p2", "blue")]);

        Assert.True(LobbyGuards.AllPlayersHaveChosenColor(state).IsSuccess);
    }

    [Fact]
    public void AllPlayersHaveChosenColor_AlsEenSpelerNogGeenKleurHeeft_IsOngeldig()
    {
        var players = new[]
        {
            TestGame.Player("p1", "red"),
            new Player("p2", "Speler p2", ColorId: null, [], null, null, false, false),
        };
        var state = LobbyState(players);

        Assert.False(LobbyGuards.AllPlayersHaveChosenColor(state).IsSuccess);
    }
}
