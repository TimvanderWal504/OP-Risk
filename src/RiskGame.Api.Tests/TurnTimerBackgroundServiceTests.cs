using Marten;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using RiskGame.Persistence.Map;
using RiskGame.Persistence.Projections;
using RiskGame.Persistence.Store;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Map;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst dat <see cref="Services.TurnTimerBackgroundService"/> (FO §5.4) een verlopen
/// beurttimer daadwerkelijk afdwingt, zonder dat een client zelf <c>EndPhase</c>/<c>EndTurn</c>
/// aanroept. Gebruikt een <see cref="FakeTimeProvider"/> om de klok expliciet te verzetten in
/// plaats van echte wandkloktijd te laten verstrijken (<c>Task.Delay</c>) — de deadline is nu
/// immers een pure afleiding uit <c>timer.LastUpdatedUtc + timer.Remaining</c>, dus de test
/// hoeft niet op de klok te wachten om dat te bewijzen.
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

    private WebApplicationFactory<Program> CreateFactory(FakeTimeProvider timeProvider) =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Postgres"] = postgres.ConnectionString,
                }));

            builder.ConfigureServices(services =>
            {
                services.AddSingleton<IRandomSource>(new SequenceRandomSource());
                services.AddSingleton<TimeProvider>(timeProvider);
            });
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

            await Task.Delay(TimeSpan.FromMilliseconds(100));
        }
    }

    /// <summary>
    /// Verzet de <see cref="FakeTimeProvider"/> in kleine stapjes van iets meer dan het
    /// pollinterval, zodat de achtergrondservice — die zelf ook via deze provider polt —
    /// telkens de kans krijgt om te draaien vóórdat we verder springen. In één keer een grote
    /// sprong maken zou de <c>PeriodicTimer</c> maar één keer laten tikken.
    /// </summary>
    private static async Task AdvancePastDeadlineAsync(
        FakeTimeProvider timeProvider, IDocumentStore store, string gameId, Func<GameState, bool> predicate)
    {
        var step = TimeSpan.FromSeconds(6);

        for (var i = 0; i < 20; i++)
        {
            timeProvider.Advance(step);

            await using var session = store.QuerySession();
            var state = await session.LoadAsync<GameState>(gameId);

            if (state is not null && predicate(state))
            {
                return;
            }

            await Task.Delay(TimeSpan.FromMilliseconds(50));
        }

        Assert.Fail($"Verwachte toestand voor spel '{gameId}' niet bereikt na herhaaldelijk verzetten van de klok.");
    }

    [Fact]
    public async Task VersterkenTimerVerloopt_SpringtRechtstreeksNaarVerplaatsen()
    {
        var timeProvider = new FakeTimeProvider();
        await using var factory = CreateFactory(timeProvider);
        using var client = factory.CreateClient(); // Bouwt/start de host, inclusief de hosted service.

        var (gameId, store) = await SetUpStateAsync(
            factory, TurnPhase.Reinforce, new PhaseTimer(TimeSpan.FromSeconds(1), timeProvider.GetUtcNow()));

        await AdvancePastDeadlineAsync(
            timeProvider, store, gameId, state => state.TurnState!.TurnPhase != TurnPhase.Reinforce);

        await using var session = store.QuerySession();
        var updated = await session.LoadAsync<GameState>(gameId);

        Assert.Equal(TurnPhase.Fortify, updated!.TurnState!.TurnPhase);
        Assert.Equal("p1", updated.TurnState.ActivePlayerId);
    }

    [Fact]
    public async Task VerplaatsenTimerVerloopt_SchuiftBeurtDoorNaarVolgendeSpeler()
    {
        var timeProvider = new FakeTimeProvider();
        await using var factory = CreateFactory(timeProvider);
        using var client = factory.CreateClient();

        var (gameId, store) = await SetUpStateAsync(
            factory, TurnPhase.Fortify, new PhaseTimer(TimeSpan.FromSeconds(1), timeProvider.GetUtcNow()));

        await AdvancePastDeadlineAsync(timeProvider, store, gameId, state => state.TurnState!.ActivePlayerId != "p1");

        await using var session = store.QuerySession();
        var updated = await session.LoadAsync<GameState>(gameId);

        Assert.Equal("p2", updated!.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhase.Reinforce, updated.TurnState.TurnPhase);
    }

    [Fact]
    public async Task GepauzeerdeTimer_VerlooptNietVanzelf()
    {
        var timeProvider = new FakeTimeProvider();
        await using var factory = CreateFactory(timeProvider);
        using var client = factory.CreateClient();

        var (gameId, store) = await SetUpStateAsync(
            factory,
            TurnPhase.Attack,
            new PhaseTimer(TimeSpan.FromSeconds(1), IsPaused: true, timeProvider.GetUtcNow()));

        // Verzet de klok ruim voorbij de deadline; de gepauzeerde timer mag niet vanzelf
        // verlopen (FO §5.4: het gevecht "kost geen beurttijd").
        for (var i = 0; i < 5; i++)
        {
            timeProvider.Advance(TimeSpan.FromSeconds(6));
            await Task.Delay(TimeSpan.FromMilliseconds(50));
        }

        await using var session = store.QuerySession();
        var state = await session.LoadAsync<GameState>(gameId);

        Assert.Equal(TurnPhase.Attack, state!.TurnState!.TurnPhase);
        Assert.True(state.TurnState.Timer!.IsPaused);
    }

    [Fact]
    public async Task HervatteTimer_TeltDoorVanafHetBevrorenRestant()
    {
        var timeProvider = new FakeTimeProvider();
        await using var factory = CreateFactory(timeProvider);
        using var client = factory.CreateClient();

        var pausedAt = timeProvider.GetUtcNow();
        var (gameId, store) = await SetUpStateAsync(
            factory, TurnPhase.Attack, new PhaseTimer(TimeSpan.FromSeconds(1), IsPaused: true, pausedAt));

        // Terwijl gepauzeerd verstrijkt er ruim voorbij het bevroren restant, zonder gevolg.
        timeProvider.Advance(TimeSpan.FromMinutes(5));

        await using (var session = store.LightweightSession())
        {
            var state = await session.LoadAsync<GameState>(gameId);
            var resumed = state!.TurnState! with
            {
                Timer = state.TurnState!.Timer!.Resume(timeProvider.GetUtcNow()),
            };

            session.Store(state.WithTurnState(resumed));
            await session.SaveChangesAsync();
        }

        await AdvancePastDeadlineAsync(
            timeProvider, store, gameId, state => state.TurnState!.PendingCombat is not null
                || state.TurnState!.TurnPhase != TurnPhase.Attack);

        // De timer had nog 1 seconde over bij hervatten; de fase moet nu doorgeschoven zijn.
        await using var finalSession = store.QuerySession();
        var final = await finalSession.LoadAsync<GameState>(gameId);

        Assert.Equal(TurnPhase.Fortify, final!.TurnState!.TurnPhase);
    }

    [Fact]
    public async Task Herstart_HeeftDezelfdeDeadlineAlsVoorHetHerprojecteren()
    {
        var mapSource = new MapDefinitionSource(
            Path.Combine(AppContext.BaseDirectory, "data", "maps"));

        await using var store = GameStoreFactory.Create(postgres.ConnectionString, mapSource);
        await store.Storage.ApplyAllConfiguredChangesToDatabaseAsync();

        var gameId = $"game-{Guid.NewGuid()}";
        var now = DateTimeOffset.UtcNow;

        await using (var session = store.LightweightSession())
        {
            session.Events.StartStream<GameState>(
                gameId,
                new Persistence.Events.GameCreated(gameId, "standaard-43", Settings),
                new Persistence.Events.PlayerJoined(gameId, "p1", "Alice", IsHost: true),
                new Persistence.Events.ColorChosen(gameId, "p1", "red"),
                new Persistence.Events.TurnOrderDetermined(gameId, ["p1"]),
                new Persistence.Events.PhaseChanged(gameId, "p1", TurnPhase.Reinforce, TimeSpan.FromMinutes(3), now));

            await session.SaveChangesAsync();
        }

        await using var querySession = store.QuerySession();
        var live = await querySession.LoadAsync<GameState>(gameId);

        var rawEvents = await querySession.Events.FetchStreamAsync(gameId);
        var projection = new GameProjection(mapSource);
        GameState? replayed = null;

        foreach (var @event in rawEvents)
        {
            replayed = @event.Data switch
            {
                Persistence.Events.GameCreated created => projection.Create(created),
                Persistence.Events.PlayerJoined joined => projection.Apply(replayed!, joined),
                Persistence.Events.ColorChosen chosen => projection.Apply(replayed!, chosen),
                Persistence.Events.TurnOrderDetermined determined => projection.Apply(replayed!, determined),
                Persistence.Events.PhaseChanged phaseChanged => projection.Apply(replayed!, phaseChanged),
                var unexpected => throw new InvalidOperationException(
                    $"Onbekend event-type: {unexpected.GetType()}"),
            };
        }

        var liveDeadline = live!.TurnState!.Timer!.LastUpdatedUtc + live.TurnState.Timer.Remaining;
        var replayedDeadline = replayed!.TurnState!.Timer!.LastUpdatedUtc + replayed.TurnState.Timer.Remaining;

        Assert.Equal(liveDeadline, replayedDeadline);
    }

    [Fact]
    public async Task GeweigerdeOverstap_CrashtNietEnBlijftInDeOorspronkelijkeFase()
    {
        var timeProvider = new FakeTimeProvider();
        await using var factory = CreateFactory(timeProvider);
        using var client = factory.CreateClient();

        // PendingCombat staat nog open tijdens Aanvallen: ForceAdvanceToFortifyAsync wijst dit
        // af (zie TurnFlowCommandHandler), dus de timer mag hier niet zomaar doorschakelen.
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");

        var alice = new Player(
            "p1", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false);

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0))
            .ToArray();

        var state = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            Settings,
            players: [alice],
            territories,
            turnOrder: ["p1"],
            turnState: new TurnState(
                "p1",
                TurnPhase.Attack,
                new PhaseTimer(TimeSpan.FromSeconds(1), timeProvider.GetUtcNow()),
                PendingCombat: new PendingCombat("alaska", "alberta", AttackDice: 2)),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();
        await store.Storage.ApplyAllConfiguredChangesToDatabaseAsync();

        await using (var session = store.LightweightSession())
        {
            session.Store(state);
            await session.SaveChangesAsync();
        }

        for (var i = 0; i < 5; i++)
        {
            timeProvider.Advance(TimeSpan.FromSeconds(6));
            await Task.Delay(TimeSpan.FromMilliseconds(50));
        }

        await using var querySession = store.QuerySession();
        var reloaded = await querySession.LoadAsync<GameState>(gameId);

        Assert.Equal(TurnPhase.Attack, reloaded!.TurnState!.TurnPhase);
        Assert.NotNull(reloaded.TurnState.PendingCombat);
    }
}
