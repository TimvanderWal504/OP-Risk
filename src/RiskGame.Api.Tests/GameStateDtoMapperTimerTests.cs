using Marten;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Map;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst dat <see cref="GameStateDtoMapper"/> <see cref="TurnTimerDto.RemainingMs"/> correct
/// afleidt uit <see cref="PhaseTimer"/> (FO §5.4, "Vastgestelde serverfeit 3" in het
/// Reinforce-plan): relatief t.o.v. de meegegeven <see cref="TimeProvider"/>, nooit negatief,
/// en bevroren zolang <see cref="PhaseTimer.IsPaused"/> waar is. Gebruikt <see cref="FakeTimeProvider"/>
/// zodat de klok expliciet te verzetten is, net als <see cref="TurnTimerBackgroundServiceTests"/>.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameStateDtoMapperTimerTests(PostgresFixture postgres)
{
    private static readonly GameSettings Settings = new(
        WinCondition.SecretMissions,
        SetupMode.Claiming,
        StartingArmiesPresetId: "classic",
        TurnTimer: TimeSpan.FromMinutes(3),
        FortifyTimer: TimeSpan.FromMinutes(1),
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentMode.Random,
        EventsEnabled: false);

    /// <summary>
    /// Zonder <c>TurnTimerBackgroundService</c>: deze tests bewijzen de afleiding in de mapper,
    /// niet het aftellen. Met die service erbij zou het vooruitzetten van de
    /// <see cref="FakeTimeProvider"/> hem laten tikken en de fase-overgang laten uitvoeren die
    /// deze tests juist níet willen zien — precies wat de opmerking bij
    /// <see cref="Timer_VerlopenDoorNietAfgehandeldeTimeout_KlemtOpNul"/> al veronderstelde.
    /// </summary>
    private WebApplicationFactory<Program> CreateFactory(FakeTimeProvider timeProvider) =>
        ApiTestHost.Create(
            postgres,
            services =>
            {
                services.AddSingleton<IRandomSource>(new SequenceRandomSource());
                services.AddSingleton<TimeProvider>(timeProvider);
            });

    private static Task<HubConnection> ConnectAsync(WebApplicationFactory<Program> factory, HttpClient client) =>
        ApiTestHost.ConnectAsync(factory, client);

    private static async Task<string> SetUpInProgressStateAsync(
        WebApplicationFactory<Program> factory, PhaseTimer timer, IReadOnlyCollection<string>? ownedTerritoryIds = null,
        TurnPhase turnPhase = TurnPhase.Reinforce)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");

        var player = new Player(
            "p1", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false);

        var owned = ownedTerritoryIds ?? [];
        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(
                territory.Id, owned.Contains(territory.Id) ? "p1" : null, ArmyCount: owned.Contains(territory.Id) ? 1 : 0))
            .ToArray();

        var state = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            Settings,
            players: [player],
            territories,
            turnOrder: ["p1"],
            turnState: new TurnState("p1", turnPhase, timer, PendingCombat: null, ArmiesRemaining: 0),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();

        await using var session = store.LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    [Fact]
    public async Task Timer_NaVerstrekenTijd_TeltRemainingMsAf()
    {
        var timeProvider = new FakeTimeProvider();
        await using var factory = CreateFactory(timeProvider);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var setAt = timeProvider.GetUtcNow();
        var gameId = await SetUpInProgressStateAsync(
            factory, new PhaseTimer(TimeSpan.FromMinutes(3), setAt));

        timeProvider.Advance(TimeSpan.FromSeconds(20));

        var state = await connection.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.NotNull(state.TurnState!.Timer);
        Assert.Equal((int)TimeSpan.FromMinutes(3 - 20.0 / 60).TotalMilliseconds, state.TurnState.Timer!.RemainingMs);
        Assert.False(state.TurnState.Timer.IsPaused);
    }

    [Fact]
    public async Task Timer_Gepauzeerd_TeltNietAf()
    {
        var timeProvider = new FakeTimeProvider();
        await using var factory = CreateFactory(timeProvider);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var pausedAt = timeProvider.GetUtcNow();
        var pausedTimer = new PhaseTimer(TimeSpan.FromSeconds(90), IsPaused: true, pausedAt);
        var gameId = await SetUpInProgressStateAsync(factory, pausedTimer);

        timeProvider.Advance(TimeSpan.FromMinutes(5));

        var state = await connection.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.Equal((int)TimeSpan.FromSeconds(90).TotalMilliseconds, state.TurnState!.Timer!.RemainingMs);
        Assert.True(state.TurnState.Timer.IsPaused);
    }

    [Fact]
    public async Task Timer_VerlopenDoorNietAfgehandeldeTimeout_KlemtOpNul()
    {
        var timeProvider = new FakeTimeProvider();
        await using var factory = CreateFactory(timeProvider);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var setAt = timeProvider.GetUtcNow();
        var gameId = await SetUpInProgressStateAsync(
            factory, new PhaseTimer(TimeSpan.FromMinutes(3), setAt));

        // Ver voorbij de deadline, zonder dat TurnTimerBackgroundService al heeft ingegrepen
        // (deze test draait de background service niet mee) — precies het venster waarin de
        // aftrek anders negatief zou uitvallen.
        timeProvider.Advance(TimeSpan.FromMinutes(10));

        var state = await connection.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.Equal(0, state.TurnState!.Timer!.RemainingMs);
    }

    [Fact]
    public async Task ReinforcementBreakdown_TijdensReinforce_WordtGevuld()
    {
        var timeProvider = new FakeTimeProvider();
        await using var factory = CreateFactory(timeProvider);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpInProgressStateAsync(
            factory, new PhaseTimer(TimeSpan.FromMinutes(3), timeProvider.GetUtcNow()), ownedTerritoryIds: ["alaska"]);

        var state = await connection.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.NotNull(state.TurnState!.ReinforcementBreakdown);
        Assert.Equal(3, state.TurnState.ReinforcementBreakdown!.BaseArmies);
        Assert.Equal(0, state.TurnState.ReinforcementBreakdown.ContinentBonus);
        Assert.Equal(0, state.TurnState.ReinforcementBreakdown.RoleBonus);
        Assert.Equal(0, state.TurnState.ReinforcementBreakdown.EventBonus);
    }

    [Fact]
    public async Task ReinforcementBreakdown_BuitenReinforce_IsNull()
    {
        var timeProvider = new FakeTimeProvider();
        await using var factory = CreateFactory(timeProvider);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpInProgressStateAsync(
            factory, new PhaseTimer(TimeSpan.FromMinutes(3), timeProvider.GetUtcNow()), turnPhase: TurnPhase.Attack);

        var state = await connection.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.Null(state.TurnState!.ReinforcementBreakdown);
    }
}
