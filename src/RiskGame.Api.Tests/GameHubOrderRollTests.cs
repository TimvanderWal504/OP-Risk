using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;
using RiskGame.Rules.Abstractions;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst de TO §4-pijplijn voor <c>StartGame</c> en <c>RollForOrder</c> end-to-end,
/// zelfde opzet als <see cref="GameHubLobbyTests"/>. De gecontroleerde gelijkspel-scenario's
/// vervangen de productie-<see cref="IRandomSource"/> door een <see cref="SequenceRandomSource"/>
/// zodat de dobbelworpen vaststaan (TO §9: reproduceerbaar via een test-double).
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubOrderRollTests(PostgresFixture postgres)
{
    private static readonly GameSettingsDto Settings = new(
        WinConditionDto.SecretMissions,
        SetupModeDto.Claiming,
        StartingArmiesPresetId: "classic",
        TurnTimerSeconds: 180,
        FortifyTimerSeconds: 60,
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentModeDto.Random,
        EventsEnabled: false);

    private WebApplicationFactory<Program> CreateFactory(IRandomSource? randomSource = null) =>
        ApiTestHost.Create(
            postgres,
            randomSource is null ? null : services => services.AddSingleton(randomSource));

    private static async Task<string> CreateGameAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync(
            "/games", new CreateGameRequest("standaard-43", Settings));
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<CreateGameResponse>();

        return body!.GameId;
    }

    private static Task<HubConnection> ConnectAsync(WebApplicationFactory<Program> factory, HttpClient client) =>
        ApiTestHost.ConnectAsync(factory, client);

    private static async Task<string> JoinAndChooseColorAsync(
        HubConnection connection, string gameId, string playerName, string colorId)
    {
        var joined = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, playerName);
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, joined.PlayerId, colorId);

        return joined.PlayerId;
    }

    [Fact]
    public async Task StartGame_DoorHostMetVoldoendeSpelersEnKleuren_GaatNaarOrderRoll()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client);
        await using var connection = await ConnectAsync(factory, client);

        var aliceId = await JoinAndChooseColorAsync(connection, gameId, "Alice", "red");
        await JoinAndChooseColorAsync(connection, gameId, "Bob", "blue");

        var state = await connection.InvokeAsync<GameStateDto>("StartGame", gameId, aliceId);

        Assert.Equal(GamePhaseDto.OrderRoll, state.Phase);
    }

    [Fact]
    public async Task StartGame_DoorNietHost_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client);
        await using var connection = await ConnectAsync(factory, client);

        await JoinAndChooseColorAsync(connection, gameId, "Alice", "red");
        var bobId = await JoinAndChooseColorAsync(connection, gameId, "Bob", "blue");

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("StartGame", gameId, bobId));

        Assert.Contains("lobby.notHost", exception.Message);
    }

    [Fact]
    public async Task RollForOrder_MetUniekeWinnaarInDeEersteRonde_BepaaltVolgordeEnGaatNaarClaiming()
    {
        // Alice: 6+4=10, Bob: 3+2=5 — geen gelijkspel, meteen een winnaar. De eerste 2
        // waarden gaan naar StartGame's missietoewijzing (WinCondition.SecretMissions, 2
        // spelers = 2 trekkingen), pas daarna de dobbelworpen.
        var random = new SequenceRandomSource(0, 1, 6, 4, 3, 2);
        await using var factory = CreateFactory(random);
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client);
        await using var connection = await ConnectAsync(factory, client);

        var aliceId = await JoinAndChooseColorAsync(connection, gameId, "Alice", "red");
        var bobId = await JoinAndChooseColorAsync(connection, gameId, "Bob", "blue");
        await connection.InvokeAsync<GameStateDto>("StartGame", gameId, aliceId);

        var aliceRoll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, aliceId);
        Assert.Equal(6, aliceRoll.Die1);
        Assert.Equal(4, aliceRoll.Die2);
        Assert.Equal(GamePhaseDto.OrderRoll, aliceRoll.State.Phase);
        Assert.Empty(aliceRoll.State.TurnOrder);
        Assert.Equal([bobId], aliceRoll.State.OrderRollState?.PlayersStillToRoll);

        var bobRoll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bobId);
        Assert.Equal(3, bobRoll.Die1);
        Assert.Equal(2, bobRoll.Die2);
        Assert.Equal(GamePhaseDto.Claiming, bobRoll.State.Phase);
        Assert.Equal([aliceId, bobId], bobRoll.State.TurnOrder);
        Assert.Empty(bobRoll.State.OrderRollState?.PlayersStillToRoll ?? []);
    }

    [Fact]
    public async Task StartGame_GaatNaarOrderRoll_IedereenMagInRonde1Gooien()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client);
        await using var connection = await ConnectAsync(factory, client);

        var aliceId = await JoinAndChooseColorAsync(connection, gameId, "Alice", "red");
        var bobId = await JoinAndChooseColorAsync(connection, gameId, "Bob", "blue");

        var state = await connection.InvokeAsync<GameStateDto>("StartGame", gameId, aliceId);

        Assert.Equal([aliceId, bobId], state.OrderRollState?.PlayersStillToRoll);
    }

    [Fact]
    public async Task RollForOrder_BroadcastDiceRolledNaarToeschouwerDieNietZelfGooit()
    {
        var random = new SequenceRandomSource(0, 1, 6, 4, 3, 2);
        await using var factory = CreateFactory(random);
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client);
        await using var connection = await ConnectAsync(factory, client);
        await using var spectator = await ConnectAsync(factory, client);

        var aliceId = await JoinAndChooseColorAsync(connection, gameId, "Alice", "red");
        await JoinAndChooseColorAsync(connection, gameId, "Bob", "blue");
        await connection.InvokeAsync<GameStateDto>("StartGame", gameId, aliceId);
        await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);

        var received = new TaskCompletionSource<DiceRolledMessage>();
        spectator.On<DiceRolledMessage>("DiceRolled", message => received.TrySetResult(message));

        await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, aliceId);

        var message = await received.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.Equal(aliceId, message.PlayerId);
        Assert.Equal([6, 4], message.Dice);
        Assert.Equal("order-roll", message.Context);
    }

    [Fact]
    public async Task RollForOrder_BijGelijkspel_LatenAlleenDeGelijkenOpnieuwGooien()
    {
        // Ronde 1: Alice 6+4=10, Bob 5+5=10 (gelijk), Carol 3+2=5 (niet gelijk).
        // Ronde 2 (alleen Alice/Bob): Alice 6+6=12, Bob 1+1=2 — Alice wint. De eerste 3
        // waarden gaan naar StartGame's missietoewijzing (3 spelers = 3 trekkingen).
        var random = new SequenceRandomSource(0, 1, 2, 6, 4, 5, 5, 3, 2, 6, 6, 1, 1);
        await using var factory = CreateFactory(random);
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client);
        await using var connection = await ConnectAsync(factory, client);

        var aliceId = await JoinAndChooseColorAsync(connection, gameId, "Alice", "red");
        var bobId = await JoinAndChooseColorAsync(connection, gameId, "Bob", "blue");
        var carolId = await JoinAndChooseColorAsync(connection, gameId, "Carol", "green");
        await connection.InvokeAsync<GameStateDto>("StartGame", gameId, aliceId);

        await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, aliceId);
        await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bobId);
        await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, carolId);

        // Ronde 1 is compleet en gelijk: Carol hoeft/mag niet nog eens gooien.
        var carolException = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, carolId));
        Assert.Contains("orderRoll.notYourTurnToRoll", carolException.Message);

        var aliceReroll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, aliceId);
        Assert.Equal(GamePhaseDto.OrderRoll, aliceReroll.State.Phase);

        var bobReroll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bobId);
        Assert.Equal(GamePhaseDto.Claiming, bobReroll.State.Phase);
        Assert.Equal([aliceId, bobId, carolId], bobReroll.State.TurnOrder);
    }
}
