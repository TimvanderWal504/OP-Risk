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
/// Bewijst de TO §4-pijplijn voor <c>SelectRole</c> (FO §8, Kiezen-modus) en de gevolgen
/// van roltoewijzing op <c>StartGame</c> en <c>ClaimTerritory</c> (FO §8.1: eigen
/// rol-herkomstland niet claimbaar), zelfde opzet als <see cref="GameHubSetupTests"/>.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubRoleTests(PostgresFixture postgres)
{
    private static readonly GameSettingsDto ChooseSettings = new(
        WinConditionDto.WorldDomination,
        SetupModeDto.Claiming,
        StartingArmies: 25,
        TurnTimerSeconds: 180,
        FortifyTimerSeconds: 60,
        RolesEnabled: true,
        RoleAssignment: RoleAssignmentModeDto.Choose,
        EventsEnabled: false);

    private static readonly GameSettingsDto RandomRoleSettings = ChooseSettings with
    {
        RoleAssignment = RoleAssignmentModeDto.Random,
    };

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

    private static async Task<string> CreateGameAsync(HttpClient client, GameSettingsDto settings)
    {
        var response = await client.PostAsJsonAsync("/games", new CreateGameRequest("standaard-43", settings));
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
    public async Task SelectRole_MetGeldigeRol_WordtToegekendEnIsZichtbaarOpDeStaat()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client, ChooseSettings);
        await using var connection = await ConnectAsync(factory, client);

        var aliceId = await JoinAndChooseColorAsync(connection, gameId, "Alice", "red");

        var state = await connection.InvokeAsync<GameStateDto>("SelectRole", gameId, aliceId, "president");

        Assert.Equal("president", state.Players.Single(player => player.Id == aliceId).RoleId);
    }

    [Fact]
    public async Task SelectRole_MetAlGekozenRol_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client, ChooseSettings);
        await using var connection = await ConnectAsync(factory, client);

        var aliceId = await JoinAndChooseColorAsync(connection, gameId, "Alice", "red");
        var bobId = await JoinAndChooseColorAsync(connection, gameId, "Bob", "blue");
        await connection.InvokeAsync<GameStateDto>("SelectRole", gameId, aliceId, "president");

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("SelectRole", gameId, bobId, "president"));

        Assert.Contains("al gekozen", exception.Message);
    }

    [Fact]
    public async Task StartGame_MetKiezenModusEnNietIedereenHeeftEenRolGekozen_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client, ChooseSettings);
        await using var connection = await ConnectAsync(factory, client);

        var aliceId = await JoinAndChooseColorAsync(connection, gameId, "Alice", "red");
        await JoinAndChooseColorAsync(connection, gameId, "Bob", "blue");
        await connection.InvokeAsync<GameStateDto>("SelectRole", gameId, aliceId, "president");

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("StartGame", gameId, aliceId));

        Assert.Contains("rol gekozen", exception.Message);
    }

    [Fact]
    public async Task StartGame_MetRandomRolmodus_WijstElkeSpelerAutomatischEenRolToe()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client, RandomRoleSettings);
        await using var connection = await ConnectAsync(factory, client);

        var aliceId = await JoinAndChooseColorAsync(connection, gameId, "Alice", "red");
        var bobId = await JoinAndChooseColorAsync(connection, gameId, "Bob", "blue");

        var state = await connection.InvokeAsync<GameStateDto>("StartGame", gameId, aliceId);

        Assert.NotNull(state.Players.Single(player => player.Id == aliceId).RoleId);
        Assert.NotNull(state.Players.Single(player => player.Id == bobId).RoleId);
        Assert.NotEqual(
            state.Players.Single(player => player.Id == aliceId).RoleId,
            state.Players.Single(player => player.Id == bobId).RoleId);
    }

    [Fact]
    public async Task ClaimTerritory_OpEigenRolHerkomstland_WordtGeweigerd()
    {
        // Alice: 6+4=10, Bob: 3+2=5 — geen gelijkspel, meteen een winnaar; Alice claimt dus
        // als eerste. Geen SecretMissions in deze settings, dus geen extra trekkingen vóór
        // de order-roll-dobbelstenen.
        var random = new SequenceRandomSource(6, 4, 3, 2);
        await using var factory = CreateFactory(random);
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client, ChooseSettings);
        await using var connection = await ConnectAsync(factory, client);

        var aliceId = await JoinAndChooseColorAsync(connection, gameId, "Alice", "red");
        var bobId = await JoinAndChooseColorAsync(connection, gameId, "Bob", "blue");
        // Herkomstland van "president" is "eastern-united-states" (data/maps/standaard-43/roles.json).
        await connection.InvokeAsync<GameStateDto>("SelectRole", gameId, aliceId, "president");
        await connection.InvokeAsync<GameStateDto>("SelectRole", gameId, bobId, "generaal");
        await connection.InvokeAsync<GameStateDto>("StartGame", gameId, aliceId);

        await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, aliceId);
        var bobRoll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bobId);
        Assert.Equal([aliceId, bobId], bobRoll.State.TurnOrder);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>(
                "ClaimTerritory", gameId, aliceId, "eastern-united-states"));

        Assert.Contains("rol-herkomstland", exception.Message);
    }
}
