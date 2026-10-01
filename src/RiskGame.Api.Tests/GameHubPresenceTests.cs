using Marten;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Json;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;
using RiskGame.Api.Services;
using RiskGame.Persistence.Map;
using RiskGame.Persistence.Sessions;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// Aanwezigheid en terugkeer (FO §11.1/§11.2, TO §4.1/§6.3): wie zich met zijn sessietoken meldt,
/// telt als verbonden, en een speler op auto-pass is terug zodra zijn telefoon opnieuw verbindt.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubPresenceTests(PostgresFixture postgres)
{
    private const string BobsToken = "token-van-bob";

    private WebApplicationFactory<Program> CreateFactory() =>
        ApiTestHost.Create(postgres, services => services.AddSingleton<IRandomSource>(new SequenceRandomSource()));

    /// <summary>Een lopend spel: p1 aan de beurt, p2 (met sessietoken) op auto-pass.</summary>
    private static async Task<string> SetUpAsync(WebApplicationFactory<Program> factory, bool bobIsAutoPass = true)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var map = factory.Services.GetRequiredService<IMapDefinitionSource>().Load("standaard-43");

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            StartingArmiesPresetId: "classic",
            TurnTimer: TimeSpan.FromMinutes(3),
            FortifyTimer: TimeSpan.FromMinutes(1),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "alaska" => new TerritoryOwnership(territory.Id, "p1", 3),
                "alberta" => new TerritoryOwnership(territory.Id, "p2", 3),
                _ => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0),
            })
            .ToArray();

        var state = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            settings,
            players:
            [
                new Player("p1", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false, IsHost: true),
                new Player("p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: bobIsAutoPass),
            ],
            territories,
            turnOrder: ["p1", "p2"],
            turnState: new TurnState("p1", TurnPhase.Reinforce, new PhaseTimer(settings.TurnTimer, DateTimeOffset.UtcNow), PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        await using var session = factory.Services.GetRequiredService<IDocumentStore>().LightweightSession();
        session.Store(state);
        session.Store(new PlayerSessionToken("p2", gameId, BobsToken));
        await session.SaveChangesAsync();

        return gameId;
    }

    private static async Task<GameState> LoadAsync(WebApplicationFactory<Program> factory, string gameId)
    {
        await using var session = factory.Services.GetRequiredService<IDocumentStore>().QuerySession();

        return (await session.LoadAsync<GameState>(gameId))!;
    }

    [Fact]
    public async Task RejoinGame_MetEigenTokenTerwijlOpAutoPass_HeftAutoPassOpEnStuurtIedereenDeNieuweState()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var bob = await ApiTestHost.ConnectAsync(factory, client);
        await using var spectator = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory);
        var before = await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);

        var pushed = new TaskCompletionSource<GameStateDto>();
        spectator.On<GameStateDto>("GameStateUpdated", state => pushed.TrySetResult(state));

        var rejoined = await bob.InvokeAsync<GameStateDto>("RejoinGame", gameId, "p2", BobsToken);

        Assert.False((await LoadAsync(factory, gameId)).Player("p2").IsAutoPass);
        Assert.True((await pushed.Task.WaitAsync(TimeSpan.FromSeconds(5))).StateVersion > before.StateVersion);
        Assert.True(rejoined.StateVersion > before.StateVersion);
    }

    /// <summary>Zonder het eigen token kan een ander apparaat iemand niet "terughalen".</summary>
    [Fact]
    public async Task RejoinGame_ZonderGeldigToken_LaatAutoPassStaan()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory);

        await connection.InvokeAsync<GameStateDto>("RejoinGame", gameId, "p2", "verkeerd-token");

        Assert.True((await LoadAsync(factory, gameId)).Player("p2").IsAutoPass);
    }

    [Fact]
    public async Task RejoinGame_MetEigenTokenZonderAutoPass_SchrijftNiets()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var bob = await ApiTestHost.ConnectAsync(factory, client);
        await using var spectator = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, bobIsAutoPass: false);
        var before = await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);

        var rejoined = await bob.InvokeAsync<GameStateDto>("RejoinGame", gameId, "p2", BobsToken);

        Assert.Equal(before.StateVersion, rejoined.StateVersion);
    }

    /// <summary>TO §4.1: alleen een connectie die zich met het eigen token meldt, telt als die speler.</summary>
    [Fact]
    public async Task RejoinGame_MetEigenToken_RegistreertDeConnectieEnHetVerbrekenMaaktDeSpelerAfwezig()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var bob = await ApiTestHost.ConnectAsync(factory, client);
        await using var stranger = await ApiTestHost.ConnectAsync(factory, client);
        var presence = factory.Services.GetRequiredService<PlayerPresenceRegistry>();

        var gameId = await SetUpAsync(factory, bobIsAutoPass: false);

        await bob.InvokeAsync<GameStateDto>("RejoinGame", gameId, "p2", BobsToken);
        await stranger.InvokeAsync<GameStateDto>("RejoinGame", gameId, "p2", "");

        Assert.True(presence.IsConnectionOf(bob.ConnectionId!, gameId, "p2"));
        Assert.False(presence.IsConnectionOf(stranger.ConnectionId!, gameId, "p2"));
        Assert.Null(presence.AbsentSince(gameId, "p2"));

        await bob.DisposeAsync();

        // De server verwerkt het verbreken asynchroon.
        var deadline = DateTimeOffset.UtcNow.AddSeconds(5);
        while (presence.AbsentSince(gameId, "p2") is null && DateTimeOffset.UtcNow < deadline)
        {
            await Task.Delay(20);
        }

        Assert.NotNull(presence.AbsentSince(gameId, "p2"));
    }

    /// <summary>
    /// TO §4.1: <c>JoinGame</c> is de eerste registratie van elke speler — zonder die registratie zou
    /// een host die nooit herverbindt nooit als weg tellen (FO §11.1).
    /// </summary>
    [Fact]
    public async Task JoinGame_RegistreertDeConnectieAlsDieSpeler()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);
        var presence = factory.Services.GetRequiredService<PlayerPresenceRegistry>();

        var response = await client.PostAsJsonAsync(
            "/games",
            new CreateGameRequest(
                "standaard-43",
                new GameSettingsDto(
                    WinConditionDto.SecretMissions,
                    SetupModeDto.Claiming,
                    StartingArmiesPresetId: "classic",
                    TurnTimerSeconds: 180,
                    FortifyTimerSeconds: 60,
                    RolesEnabled: false,
                    RoleAssignment: RoleAssignmentModeDto.Random,
                    EventsEnabled: false)));
        response.EnsureSuccessStatusCode();
        var gameId = (await response.Content.ReadFromJsonAsync<CreateGameResponse>())!.GameId;

        var joined = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");

        Assert.True(presence.IsConnectionOf(connection.ConnectionId!, gameId, joined.PlayerId));
    }
}
