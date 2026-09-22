using System.Net.Http.Json;
using Marten;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Map;
using RiskGame.Rules.State;

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
        StartingArmiesPresetId: "classic",
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
        ApiTestHost.Create(
            postgres,
            randomSource is null ? null : services => services.AddSingleton(randomSource));

    private static async Task<string> CreateGameAsync(HttpClient client, GameSettingsDto settings)
    {
        var response = await client.PostAsJsonAsync("/games", new CreateGameRequest("standaard-43", settings));
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

        Assert.Contains("lobby.roleTaken", exception.Message);
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

        Assert.Contains("lobby.notAllRolesChosen", exception.Message);
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
        // als eerste. Geen SecretMissions in deze settings (dus geen missie-trekkingen), wel
        // DeckShuffleFiller.Values voor StartGame's deck-shuffle, vóór de order-roll-dobbelstenen.
        var random = new SequenceRandomSource([.. DeckShuffleFiller.Values, 6, 4, 3, 2]);
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

        Assert.Contains("setup.cannotClaimOwnRoleOrigin", exception.Message);
    }

    /// <summary>
    /// Bouwt een spel rechtstreeks op in de projectie-fase InProgress met p1 als "generaal"
    /// (herkomstland "china") — nodig om <c>PlayerDto.IsRoleActive</c> (plan-rollen C4) te
    /// bewijzen zonder om te lopen via de Claiming-restrictie op het eigen herkomstland
    /// (<see cref="ClaimTerritory_OpEigenRolHerkomstland_WordtGeweigerd"/> hierboven): eenmaal
    /// InProgress kan een rolhouder zijn herkomstland best bezitten (bv. via verovering), en de
    /// mapper-vlag moet dan ook echt kantelen.
    /// </summary>
    private static async Task<string> SetUpInProgressStateWithRoleAsync(
        WebApplicationFactory<Program> factory, bool ownsOrigin)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            StartingArmiesPresetId: "classic",
            TurnTimer: TimeSpan.FromMinutes(3),
            FortifyTimer: TimeSpan.FromMinutes(1),
            RolesEnabled: true,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        var alice = new Player("p1", "Alice", "red", Hand: [], RoleId: "generaal", Mission: null, IsEliminated: false);
        var bob = new Player("p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false);

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "china" => new TerritoryOwnership(territory.Id, ownsOrigin ? "p1" : "p2", ArmyCount: 1),
                "alaska" => new TerritoryOwnership(territory.Id, "p1", ArmyCount: 3),
                _ => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0),
            })
            .ToArray();

        var state = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            settings,
            players: [alice, bob],
            territories,
            turnOrder: ["p1", "p2"],
            turnState: new TurnState("p1", TurnPhase.Reinforce, new PhaseTimer(settings.TurnTimer, DateTimeOffset.UtcNow), PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();

        await using var session = store.LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    [Fact]
    public async Task WatchGame_MetActieveRol_VultIsRoleActive()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpInProgressStateWithRoleAsync(factory, ownsOrigin: true);

        var state = await connection.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.True(state.Players.Single(player => player.Id == "p1").IsRoleActive);
    }

    [Fact]
    public async Task WatchGame_ZonderHerkomstlandInBezit_IsRoleActiveIsOnwaar()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpInProgressStateWithRoleAsync(factory, ownsOrigin: false);

        var state = await connection.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.False(state.Players.Single(player => player.Id == "p1").IsRoleActive);
    }

    [Fact]
    public async Task WatchGame_ZonderRol_IsRoleActiveIsOnwaar()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpInProgressStateWithRoleAsync(factory, ownsOrigin: true);

        var state = await connection.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.False(state.Players.Single(player => player.Id == "p2").IsRoleActive);
    }
}
