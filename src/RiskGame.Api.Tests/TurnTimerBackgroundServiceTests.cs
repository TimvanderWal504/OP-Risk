using Marten;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Map;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst dat <see cref="Services.TurnTimerBackgroundService"/> (FO §5.4) een verlopen
/// beurttimer daadwerkelijk afdwingt, zonder dat een client zelf <c>EndPhase</c>/<c>EndTurn</c>
/// aanroept. Gebruikt een expres zeer korte <see cref="PhaseTimer"/> (seconden, niet minuten)
/// zodat de test niet onnodig lang hoeft te wachten op het pollinterval.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class TurnTimerBackgroundServiceTests(PostgresFixture postgres)
{
    private const int StartingArmies = 25;

    private static readonly GameSettings Settings = new(
        WinCondition.SecretMissions,
        SetupMode.Claiming,
        StartingArmies,
        TurnTimer: TimeSpan.FromMinutes(3),
        FortifyTimer: TimeSpan.FromMinutes(1),
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentMode.Random,
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

    private static async Task<(string GameId, IDocumentStore Store)> SetUpStateAsync(
        WebApplicationFactory<Program> factory, TurnPhase turnPhase, PhaseTimer timer)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");

        var alice = new Player(
            "p1", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false);
        var bob = new Player(
            "p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false);

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "alaska" => new TerritoryOwnership(territory.Id, "p1", ArmyCount: 5),
                "alberta" => new TerritoryOwnership(territory.Id, "p2", ArmyCount: 3),
                _ => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0),
            })
            .ToArray();

        var state = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            Settings,
            players: [alice, bob],
            territories,
            turnOrder: ["p1", "p2"],
            turnState: new TurnState("p1", turnPhase, timer, PendingCombat: null, ArmiesRemaining: 0),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();
        await store.Storage.ApplyAllConfiguredChangesToDatabaseAsync();

        await using var session = store.LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return (gameId, store);
    }

    private static async Task<GameState> WaitForAsync(
        IDocumentStore store, string gameId, Func<GameState, bool> predicate, TimeSpan timeout)
    {
        var deadline = DateTimeOffset.UtcNow + timeout;

        while (true)
        {
            await using var session = store.QuerySession();
            var state = await session.LoadAsync<GameState>(gameId);

            if (state is not null && predicate(state))
            {
                return state;
            }

            if (DateTimeOffset.UtcNow >= deadline)
            {
                Assert.Fail($"Verwachte toestand voor spel '{gameId}' niet bereikt binnen {timeout}.");
            }

            await Task.Delay(TimeSpan.FromMilliseconds(250));
        }
    }

    [Fact]
    public async Task VersterkenTimerVerloopt_SpringtRechtstreeksNaarVerplaatsen()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient(); // Bouwt/start de host, inclusief de hosted service.

        var (gameId, store) = await SetUpStateAsync(
            factory, TurnPhase.Reinforce, new PhaseTimer(TimeSpan.FromSeconds(1)));

        var updated = await WaitForAsync(
            store, gameId, state => state.TurnState!.TurnPhase != TurnPhase.Reinforce, TimeSpan.FromSeconds(10));

        Assert.Equal(TurnPhase.Fortify, updated.TurnState!.TurnPhase);
        Assert.Equal("p1", updated.TurnState.ActivePlayerId);
    }

    [Fact]
    public async Task VerplaatsenTimerVerloopt_SchuiftBeurtDoorNaarVolgendeSpeler()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();

        var (gameId, store) = await SetUpStateAsync(
            factory, TurnPhase.Fortify, new PhaseTimer(TimeSpan.FromSeconds(1)));

        var updated = await WaitForAsync(
            store, gameId, state => state.TurnState!.ActivePlayerId != "p1", TimeSpan.FromSeconds(10));

        Assert.Equal("p2", updated.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhase.Reinforce, updated.TurnState.TurnPhase);
    }

    [Fact]
    public async Task GepauzeerdeTimer_VerlooptNietVanzelf()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();

        var (gameId, store) = await SetUpStateAsync(
            factory, TurnPhase.Attack, new PhaseTimer(TimeSpan.FromSeconds(1), IsPaused: true));

        // Geeft de achtergrondservice ruim de kans om te pollen; de gepauzeerde timer mag
        // niet vanzelf verlopen (FO §5.4: het gevecht "kost geen beurttijd").
        await Task.Delay(TimeSpan.FromSeconds(3));

        await using var session = store.QuerySession();
        var state = await session.LoadAsync<GameState>(gameId);

        Assert.Equal(TurnPhase.Attack, state!.TurnState!.TurnPhase);
        Assert.True(state.TurnState.Timer!.IsPaused);
    }
}
