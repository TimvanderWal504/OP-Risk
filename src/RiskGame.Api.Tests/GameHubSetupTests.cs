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
/// Bewijst de TO §4-pijplijn voor <c>ClaimTerritory</c> en <c>PlaceInitialArmy</c>
/// (FO §5.1) end-to-end, zelfde opzet als <see cref="GameHubOrderRollTests"/>. De
/// order-roll wordt met een <see cref="SequenceRandomSource"/> geforceerd op een unieke
/// winnaar zodat <c>TurnOrder</c> vaststaat en de claim-/plaatsingsrotatie voorspelbaar is.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubSetupTests(PostgresFixture postgres)
{
    private const int StartingArmies = 25;

    private static readonly GameSettingsDto Settings = new(
        WinConditionDto.SecretMissions,
        SetupModeDto.Claiming,
        StartingArmies,
        TurnTimerSeconds: 180,
        FortifyTimerSeconds: 60,
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentModeDto.Random,
        EventsEnabled: false);

    private WebApplicationFactory<Program> CreateFactory() =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Postgres"] = postgres.ConnectionString,
                }));

            // Alice wint de order-roll altijd meteen (10 tegen 5), zodat TurnOrder vaststaat.
            builder.ConfigureServices(services =>
                services.AddSingleton<IRandomSource>(new SequenceRandomSource(6, 4, 3, 2)));
        });

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

    private static async Task<string> CreateGameAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync(
            "/games", new CreateGameRequest("standaard-43", Settings));
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<CreateGameResponse>();

        return body!.GameId;
    }

    /// <summary>Zet een spel op tot en met de order-roll: 2 spelers, Alice wint altijd.</summary>
    private static async Task<(string GameId, string AliceId, string BobId, GameStateDto State)> SetUpToClaimingAsync(
        HubConnection connection, HttpClient client)
    {
        var gameId = await CreateGameAsync(client);

        var alice = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, alice.PlayerId, "red");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, bob.PlayerId, "blue");
        await connection.InvokeAsync<GameStateDto>("StartGame", gameId, alice.PlayerId);

        await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, alice.PlayerId);
        var bobRoll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bob.PlayerId);

        Assert.Equal(GamePhaseDto.Claiming, bobRoll.State.Phase);
        Assert.Equal([alice.PlayerId, bob.PlayerId], bobRoll.State.TurnOrder);

        return (gameId, alice.PlayerId, bob.PlayerId, bobRoll.State);
    }

    [Fact]
    public async Task ClaimTerritory_NietJeBeurt_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (gameId, _, bobId, state) = await SetUpToClaimingAsync(connection, client);
        var firstTerritoryId = state.Territories[0].TerritoryId;

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("ClaimTerritory", gameId, bobId, firstTerritoryId));

        Assert.Contains("niet aan de beurt", exception.Message);
    }

    [Fact]
    public async Task ClaimTerritory_AlGeclaimdGebied_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (gameId, aliceId, bobId, state) = await SetUpToClaimingAsync(connection, client);
        var firstTerritoryId = state.Territories[0].TerritoryId;

        await connection.InvokeAsync<GameStateDto>("ClaimTerritory", gameId, aliceId, firstTerritoryId);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("ClaimTerritory", gameId, bobId, firstTerritoryId));

        Assert.Contains("al geclaimd", exception.Message);
    }

    [Fact]
    public async Task VolledigeStartopstelling_EindigtInProgress()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (gameId, aliceId, bobId, state) = await SetUpToClaimingAsync(connection, client);
        var territoryIds = state.Territories.Select(territory => territory.TerritoryId).ToArray();
        var turnOrder = new[] { aliceId, bobId };

        string? aliceTerritoryId = null;
        string? bobTerritoryId = null;
        GameStateDto latest = state;

        for (var i = 0; i < territoryIds.Length; i++)
        {
            var claimerId = turnOrder[i % turnOrder.Length];
            latest = await connection.InvokeAsync<GameStateDto>("ClaimTerritory", gameId, claimerId, territoryIds[i]);

            if (claimerId == aliceId)
            {
                aliceTerritoryId ??= territoryIds[i];
            }
            else
            {
                bobTerritoryId ??= territoryIds[i];
            }
        }

        // 43 gebieden, om en om vanaf Alice: Alice krijgt er 22 (budget 25-22=3), Bob 21
        // (budget 25-21=4) — Claiming rondt dus vanzelf af naar InitialPlacement.
        Assert.Equal(GamePhaseDto.InitialPlacement, latest.Phase);

        var placementOrder = new[] { aliceId, bobId, aliceId, bobId, aliceId, bobId, bobId };

        foreach (var placerId in placementOrder)
        {
            var territoryId = placerId == aliceId ? aliceTerritoryId! : bobTerritoryId!;
            latest = await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, placerId, territoryId);
        }

        Assert.Equal(GamePhaseDto.InProgress, latest.Phase);
    }

    [Fact]
    public async Task PlaceInitialArmy_AlsBudgetOpIs_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (gameId, aliceId, bobId, state) = await SetUpToClaimingAsync(connection, client);
        var territoryIds = state.Territories.Select(territory => territory.TerritoryId).ToArray();
        var turnOrder = new[] { aliceId, bobId };

        string? aliceTerritoryId = null;
        string? bobTerritoryId = null;

        for (var i = 0; i < territoryIds.Length; i++)
        {
            var claimerId = turnOrder[i % turnOrder.Length];
            await connection.InvokeAsync<GameStateDto>("ClaimTerritory", gameId, claimerId, territoryIds[i]);

            if (claimerId == aliceId)
            {
                aliceTerritoryId ??= territoryIds[i];
            }
            else
            {
                bobTerritoryId ??= territoryIds[i];
            }
        }

        // Alice heeft budget 3 (25 - 22 gebieden); na 3 plaatsingen (afgewisseld met Bob,
        // die nog ruimschoots budget over heeft) is zij klaar.
        await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, aliceId, aliceTerritoryId!);
        await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, bobId, bobTerritoryId!);
        await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, aliceId, aliceTerritoryId!);
        await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, bobId, bobTerritoryId!);
        await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, aliceId, aliceTerritoryId!);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, aliceId, aliceTerritoryId!));

        Assert.Contains("niet aan de beurt", exception.Message);
    }
}
