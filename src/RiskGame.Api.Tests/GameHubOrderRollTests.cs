using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Configuration;
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
public sealed class GameHubOrderRollTests(PostgresFixture postgres) : IAsyncLifetime
{
    private static readonly GameSettingsDto Settings = new(
        WinConditionDto.SecretMissions,
        SetupModeDto.Claiming,
        StartingArmies: 25,
        TurnTimerSeconds: 180,
        FortifyTimerSeconds: 60,
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentModeDto.Random,
        EventsEnabled: false);

    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    public Task InitializeAsync()
    {
        _factory = CreateFactory();
        _client = _factory.CreateClient();

        return Task.CompletedTask;
    }

    public Task DisposeAsync()
    {
        _client.Dispose();
        _factory.Dispose();

        return Task.CompletedTask;
    }

    private WebApplicationFactory<Program> CreateFactory(IRandomSource? randomSource = null) =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Postgres"] = postgres.ConnectionString,
                }));

            if (randomSource is not null)
            {
                builder.ConfigureServices(services => services.AddSingleton(randomSource));
            }
        });

    private static async Task<string> CreateGameAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync(
            "/games", new CreateGameRequest("standaard-43", Settings));
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<CreateGameResponse>();

        return body!.GameId;
    }

    private static async Task<HubConnection> ConnectAsync(WebApplicationFactory<Program> factory, HttpClient client)
    {
        var connection = new HubConnectionBuilder()
            .WithUrl(new Uri(client.BaseAddress!, "/hubs/game"), options =>
            {
                options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
            })
            .Build();

        await connection.StartAsync();

        return connection;
    }

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
        var gameId = await CreateGameAsync(_client);
        await using var connection = await ConnectAsync(_factory, _client);

        var aliceId = await JoinAndChooseColorAsync(connection, gameId, "Alice", "red");
        await JoinAndChooseColorAsync(connection, gameId, "Bob", "blue");

        var state = await connection.InvokeAsync<GameStateDto>("StartGame", gameId, aliceId);

        Assert.Equal(GamePhaseDto.OrderRoll, state.Phase);
    }

    [Fact]
    public async Task StartGame_DoorNietHost_WordtGeweigerd()
    {
        var gameId = await CreateGameAsync(_client);
        await using var connection = await ConnectAsync(_factory, _client);

        await JoinAndChooseColorAsync(connection, gameId, "Alice", "red");
        var bobId = await JoinAndChooseColorAsync(connection, gameId, "Bob", "blue");

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("StartGame", gameId, bobId));

        Assert.Contains("geen host", exception.Message);
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

        var bobRoll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bobId);
        Assert.Equal(3, bobRoll.Die1);
        Assert.Equal(2, bobRoll.Die2);
        Assert.Equal(GamePhaseDto.Claiming, bobRoll.State.Phase);
        Assert.Equal([aliceId, bobId], bobRoll.State.TurnOrder);
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
        Assert.Contains("hoeft nu niet te werpen", carolException.Message);

        var aliceReroll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, aliceId);
        Assert.Equal(GamePhaseDto.OrderRoll, aliceReroll.State.Phase);

        var bobReroll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bobId);
        Assert.Equal(GamePhaseDto.Claiming, bobReroll.State.Phase);
        Assert.Equal([aliceId, bobId, carolId], bobReroll.State.TurnOrder);
    }
}
