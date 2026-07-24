using Marten;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Map;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst de TO §4-pijplijn voor <c>Fortify</c>, <c>EndPhase</c> en <c>EndTurn</c>
/// (FO §5.2, §5.5) end-to-end. Zelfde opzet als <see cref="GameHubAttackTests"/>: het spel
/// wordt rechtstreeks in de gewenste startsituatie opgebouwd, geen dobbelen nodig.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubTurnFlowTests(PostgresFixture postgres)
{
    private const int StartingArmies = 25;

    private static readonly GameSettingsDto SettingsDto = new(
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

            builder.ConfigureServices(services =>
                services.AddSingleton<IRandomSource>(new SequenceRandomSource()));
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

    /// <summary>
    /// Bouwt een spel rechtstreeks op met "alaska" (p1) grenzend aan "alberta" (p1 of p2,
    /// zelfde adjacency-paar als <see cref="GameHubAttackTests"/>), in de opgegeven
    /// <paramref name="turnPhase"/> voor p1, met p2 als tweede speler in de beurtvolgorde.
    /// </summary>
    private static async Task<string> SetUpStateAsync(
        WebApplicationFactory<Program> factory,
        TurnPhase turnPhase,
        string albertaOwnerId,
        int albertaArmies,
        PendingCombat? pendingCombat = null)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            StartingArmies,
            TurnTimer: TimeSpan.FromSeconds(SettingsDto.TurnTimerSeconds),
            FortifyTimer: TimeSpan.FromSeconds(SettingsDto.FortifyTimerSeconds),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        var alice = new Player(
            "p1", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false);
        var bob = new Player(
            "p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false);

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "alaska" => new TerritoryOwnership(territory.Id, "p1", ArmyCount: 5),
                "alberta" => new TerritoryOwnership(territory.Id, albertaOwnerId, albertaArmies),
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
            turnState: new TurnState(
                "p1", turnPhase, new PhaseTimer(settings.TurnTimer, DateTimeOffset.UtcNow), pendingCombat, ArmiesRemaining: 0),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();
        await store.Storage.ApplyAllConfiguredChangesToDatabaseAsync();

        await using var session = store.LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    [Fact]
    public async Task Fortify_MetAaneengeslotenPad_VerplaatstLegers()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Fortify, albertaOwnerId: "p1", albertaArmies: 1);

        var updated = await connection.InvokeAsync<GameStateDto>(
            "Fortify", gameId, "p1", "alaska", "alberta", 3);

        Assert.Equal(2, updated.Territories.Single(t => t.TerritoryId == "alaska").ArmyCount);
        Assert.Equal(4, updated.Territories.Single(t => t.TerritoryId == "alberta").ArmyCount);
    }

    [Fact]
    public async Task Fortify_NaarNietEigenGebied_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Fortify, albertaOwnerId: "p2", albertaArmies: 1);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("Fortify", gameId, "p1", "alaska", "alberta", 3));

        Assert.Contains("niet van speler", exception.Message);
    }

    [Fact]
    public async Task EndPhase_VanuitVersterken_GaatNaarAanvallen()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Reinforce, albertaOwnerId: "p2", albertaArmies: 1);

        var updated = await connection.InvokeAsync<GameStateDto>("EndPhase", gameId, "p1");

        Assert.Equal(TurnPhaseDto.Attack, updated.TurnState!.TurnPhase);
        Assert.Equal("p1", updated.TurnState.ActivePlayerId);
    }

    [Fact]
    public async Task EndPhase_VanuitAanvallenZonderLopendGevecht_GaatNaarVerplaatsen()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Attack, albertaOwnerId: "p2", albertaArmies: 1);

        var updated = await connection.InvokeAsync<GameStateDto>("EndPhase", gameId, "p1");

        Assert.Equal(TurnPhaseDto.Fortify, updated.TurnState!.TurnPhase);
    }

    [Fact]
    public async Task EndPhase_VanuitAanvallenMetLopendGevecht_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory, TurnPhase.Attack, albertaOwnerId: "p2", albertaArmies: 1,
            pendingCombat: new PendingCombat("alaska", "alberta", AttackDice: 2));

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("EndPhase", gameId, "p1"));

        Assert.Contains("loopt nog een gevecht", exception.Message);
    }

    [Fact]
    public async Task EndPhase_VanuitVerplaatsen_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Fortify, albertaOwnerId: "p2", albertaArmies: 1);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("EndPhase", gameId, "p1"));

        Assert.Contains("gebruik EndTurn", exception.Message);
    }

    [Fact]
    public async Task EndTurn_VanuitVerplaatsen_SchuiftDoorNaarVolgendeSpelerVersterken()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Fortify, albertaOwnerId: "p2", albertaArmies: 1);

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        Assert.Equal("p2", updated.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhaseDto.Reinforce, updated.TurnState.TurnPhase);
    }

    [Fact]
    public async Task EndTurn_NietVanuitVerplaatsen_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Attack, albertaOwnerId: "p2", albertaArmies: 1);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1"));

        Assert.Contains("Dit kan alleen tijdens Fortify", exception.Message);
    }
}
