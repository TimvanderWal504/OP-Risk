using Marten;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Api.Commands;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Effects;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// De gebeurtenisronde end-to-end (FO §9.2): trekken op de rondegrens bij <c>EndTurn</c>, de bonus
/// in de versterkingen van de eerstvolgende beurt, verlopende effecten, en de attrition-keuzes via
/// <c>RemoveArmies</c> — inclusief de tussentoestand waarin geen beurt loopt.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubEventRoundTests(PostgresFixture postgres)
{
    private WebApplicationFactory<Program> CreateFactory(IRandomSource? randomSource = null) =>
        ApiTestHost.Create(
            postgres, services => services.AddSingleton<IRandomSource>(randomSource ?? new SequenceRandomSource()));

    /// <summary>
    /// p1 (Alaska) en p2 (Alberta), beurtvolgorde p1 → p2, gebeurtenisronde aan. Standaard is p2
    /// aan zet in Verplaatsen, zodat diens <c>EndTurn</c> precies op de rondegrens valt.
    /// </summary>
    private static async Task<string> SetUpAsync(
        WebApplicationFactory<Program> factory,
        IReadOnlyList<string> drawPile,
        string activePlayerId = "p2",
        bool eventsEnabled = true,
        int alaskaArmies = 5,
        int albertaArmies = 2,
        IReadOnlyList<string>? activeEventIds = null,
        string? bobMissionId = null,
        bool aliceEliminatedByBob = false)
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
            EventsEnabled: eventsEnabled);

        var alice = new Player(
            "p1", "Alice", "red", Hand: [], RoleId: null, Mission: null,
            IsEliminated: aliceEliminatedByBob, EliminatedByPlayerId: aliceEliminatedByBob ? "p2" : null);
        var bob = new Player(
            "p2", "Bob", "blue", Hand: [], RoleId: null,
            Mission: bobMissionId is null ? null : map.Missions.Single(mission => mission.Id == bobMissionId),
            IsEliminated: false);

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "alaska" => new TerritoryOwnership(territory.Id, "p1", alaskaArmies),
                "alberta" => new TerritoryOwnership(territory.Id, "p2", albertaArmies),
                _ => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0),
            })
            .ToArray();

        var activeEffects = (activeEventIds ?? [])
            .Select(id => new ActiveEffect(map.Events.Single(definition => definition.Id == id).Effect))
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
                activePlayerId, TurnPhase.Fortify, new PhaseTimer(settings.FortifyTimer, DateTimeOffset.UtcNow), PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: activeEffects,
            eventRound: EventRoundState.Empty with { DrawPile = drawPile });

        await using var session = factory.Services.GetRequiredService<IDocumentStore>().LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    private static async Task<GameState> LoadAsync(WebApplicationFactory<Program> factory, string gameId)
    {
        await using var session = factory.Services.GetRequiredService<IDocumentStore>().QuerySession();

        return (await session.LoadAsync<GameState>(gameId))!;
    }

    [Fact]
    public async Task EndTurn_MiddenInDeRonde_TrektGeenKaart()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, drawPile: ["babyboom"], activePlayerId: "p1");

        await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        var state = await LoadAsync(factory, gameId);
        Assert.Null(state.EventRound.CurrentEventId);
        Assert.Equal(["babyboom"], state.EventRound.DrawPile);
    }

    [Fact]
    public async Task EndTurn_OpDeRondegrensMetGebeurtenisrondeUit_TrektGeenKaart()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, drawPile: ["babyboom"], eventsEnabled: false);

        await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2");

        Assert.Null((await LoadAsync(factory, gameId)).EventRound.CurrentEventId);
    }

    /// <summary>Een gewonnen spel trekt geen kaart meer (FO §6.2, §9.2).</summary>
    [Fact]
    public async Task EndTurn_DatHetSpelWint_TrektGeenKaart()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(
            factory, drawPile: ["babyboom"], bobMissionId: "eliminate-red", aliceEliminatedByBob: true);

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2");

        Assert.Equal(GamePhaseDto.Finished, updated.Phase);
        Assert.Null((await LoadAsync(factory, gameId)).EventRound.CurrentEventId);
    }

    /// <summary>
    /// De review-eis: de eerste speler na de rondegrens krijgt de nét getrokken bonus al in zijn
    /// versterkingen, en het opbouwpaneel toont hem (FO §9.2).
    /// </summary>
    [Fact]
    public async Task EndTurn_OpDeRondegrens_TrektDeBovensteKaartEnGeeftDeEersteSpelerDeBonus()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, drawPile: ["babyboom", "griepgolf"]);

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2");

        // Alice heeft één gebied: basis 3, plus 2 uit Babyboom.
        Assert.Equal("p1", updated.TurnState!.ActivePlayerId);
        Assert.Equal(5, updated.TurnState.ArmiesRemaining);
        Assert.Equal(2, updated.TurnState.ReinforcementBreakdown!.EventBonus);
        Assert.Contains(
            updated.RecentActions,
            action => action.Kind == RecentActionKindDto.EventDrawn && action.EventId == "babyboom");
        // Iedereen krijgt hetzelfde: één "Iedereen"-regel (besluit 2026-09-29).
        var bonus = Assert.Single(updated.RecentActions, action => action.Kind == RecentActionKindDto.EventBonusGranted);
        Assert.Equal((null, 2), (bonus.PlayerId, bonus.Amount));
        var turnStart = updated.RecentActions.First(action => action.Kind == RecentActionKindDto.ReinforcementsGranted);
        Assert.Equal(("p1", 5, 2, "babyboom"), (turnStart.PlayerId, turnStart.Amount, turnStart.EventBonus, turnStart.EventId));

        var state = await LoadAsync(factory, gameId);
        Assert.Equal("babyboom", state.EventRound.CurrentEventId);
        Assert.Equal(["griepgolf"], state.EventRound.DrawPile);
        Assert.Equal(2, state.Player("p2").PendingEventBonus);
    }

    [Fact]
    public async Task EndTurn_OpDeRondegrensMetLegeStapel_SchudtEerstAlleKaarten()
    {
        // Fisher-Yates vraagt per plek i een index in [i, n); de identiteit laat de volgorde staan.
        var eventCount = new MapDefinitionSource(Path.Combine(AppContext.BaseDirectory, "data", "maps"))
            .Load("standaard-43").Events.Count;

        await using var factory = CreateFactory(new SequenceRandomSource([.. Enumerable.Range(0, eventCount)]));
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, drawPile: []);

        await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2");

        var state = await LoadAsync(factory, gameId);
        Assert.Equal(state.Map.Events[0].Id, state.EventRound.CurrentEventId);
        Assert.Equal(eventCount - 1, state.EventRound.DrawPile.Count);
    }

    [Fact]
    public async Task EndTurn_OpDeRondegrens_LaatLopendeEffectenVerlopenEnMaaktEenNieuwOneRoundEffectActief()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(
            factory, drawPile: ["beringstraat-dichtgevroren"], activeEventIds: ["stormachtige-zeeen"]);

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2");

        // De TV tekent de blokkade uit wat de server meestuurt: alleen de Beringstraat, niets op slot.
        Assert.Equal("beringstraat-dichtgevroren", updated.ActiveEffect!.EventId);
        var blocked = Assert.Single(updated.ActiveEffect.BlockedBorders);
        Assert.Equal(["alaska", "kamchatka"], new[] { blocked.From, blocked.To }.Order());
        Assert.Empty(updated.ActiveEffect.LockedTerritoryIds);

        var state = await LoadAsync(factory, gameId);
        Assert.Equal("beringstraat-dichtgevroren", Assert.Single(state.ActiveEffects).Effect.Id);
        Assert.Contains(
            state.RecentActions,
            action => action.Kind == RecentActionKind.EffectExpired && action.EventId == "stormachtige-zeeen");
    }

    /// <summary>
    /// Epidemie (3 legers): Alice kan 4 afstaan en kiest dus zelf; Bob kan er maar 1 missen en staat
    /// die automatisch af. Tot Alice gekozen heeft loopt er geen beurt — ook geen tweede EndTurn.
    /// </summary>
    [Fact]
    public async Task Attrition_WachtOpDeKiezer_EnDeLaatsteKeuzeStartDeVolgendeBeurt()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, drawPile: ["epidemie-in-de-steden"], alaskaArmies: 5, albertaArmies: 2);

        var waiting = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2");

        Assert.Null(waiting.TurnState);
        Assert.Equal(("epidemie-in-de-steden", 3), (waiting.PendingAttrition!.EventId, waiting.PendingAttrition.Amount));
        Assert.Equal(["p1"], waiting.PendingAttrition.ChooserPlayerIds);
        Assert.Equal(["p1"], waiting.PendingAttrition.AwaitingPlayerIds);
        var pending = (await LoadAsync(factory, gameId)).EventRound.PendingAttrition!;
        Assert.Equal(["p1"], pending.AwaitingPlayerIds);
        Assert.Equal("p1", pending.NextPlayerId);
        Assert.Equal(1, waiting.Territories.Single(territory => territory.TerritoryId == "alberta").ArmyCount);
        Assert.Contains(
            waiting.RecentActions,
            action => action.Kind == RecentActionKindDto.ArmiesRemoved && action.PlayerId == "p2" && action.Amount == 1
                && action.EventId == "epidemie-in-de-steden");

        // Geen beurt: een late EndTurn (speler of timer) mag geen tweede trekking starten.
        var lateEndTurn = await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2"));
        Assert.Contains("common.playerNotActive", lateEndTurn.Message);

        var notAwaiting = await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync<GameStateDto>("RemoveArmies", gameId, "p2", new Dictionary<string, int> { ["alberta"] = 1 }));
        Assert.Contains("attrition.notAwaitingPlayer", notAwaiting.Message);

        var wrongTotal = await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync<GameStateDto>("RemoveArmies", gameId, "p1", new Dictionary<string, int> { ["alaska"] = 2 }));
        Assert.Contains("attrition.wrongTotalRemoved", wrongTotal.Message);

        var resumed = await connection.InvokeAsync<GameStateDto>(
            "RemoveArmies", gameId, "p1", new Dictionary<string, int> { ["alaska"] = 3 });

        Assert.Equal("p1", resumed.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhaseDto.Reinforce, resumed.TurnState.TurnPhase);
        Assert.Equal(2, resumed.Territories.Single(territory => territory.TerritoryId == "alaska").ArmyCount);
        Assert.Contains(
            resumed.RecentActions,
            action => action.Kind == RecentActionKindDto.ArmiesRemoved && action.PlayerId == "p1" && action.Amount == 3);
        Assert.Null((await LoadAsync(factory, gameId)).EventRound.PendingAttrition);
        Assert.Null(resumed.PendingAttrition);
    }

    /// <summary>Na één keuze blijven de kiezers dezelfde twee; alleen de wachtlijst krimpt (TV: "Nog 1 van 2").</summary>
    [Fact]
    public async Task Attrition_NaEenKeuze_BlijvenDeKiezersStaanEnKrimptDeWachtlijst()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, drawPile: ["griepgolf"], alaskaArmies: 5, albertaArmies: 5);
        await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2");

        var afterFirst = await connection.InvokeAsync<GameStateDto>(
            "RemoveArmies", gameId, "p1", new Dictionary<string, int> { ["alaska"] = 2 });

        Assert.Equal(["p1", "p2"], afterFirst.PendingAttrition!.ChooserPlayerIds);
        Assert.Equal(["p2"], afterFirst.PendingAttrition.AwaitingPlayerIds);
    }

    /// <summary>
    /// Wie alleen gebieden met 1 leger heeft, kiest niet en wordt niet afgewacht, maar staat wél in het
    /// verloop: "heeft geen legers om af te staan" (FO §9.2, besluit 2026-09-29).
    /// </summary>
    [Fact]
    public async Task Attrition_SpelerZonderAfstaanbareLegers_KiestNietMaarStaatInHetVerloop()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, drawPile: ["griepgolf"], alaskaArmies: 5, albertaArmies: 1);

        var waiting = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2");

        Assert.Equal(["p1"], (await LoadAsync(factory, gameId)).EventRound.PendingAttrition!.AwaitingPlayerIds);
        Assert.Contains(
            waiting.RecentActions,
            action => action.Kind == RecentActionKindDto.ArmiesRemoved && action.PlayerId == "p2" && action.Amount == 0);
    }

    [Fact]
    public async Task Attrition_TimerTikTijdensDeKeuzes_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, drawPile: ["epidemie-in-de-steden"]);
        await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2");

        await using var scope = factory.Services.CreateAsyncScope();
        var turnFlow = scope.ServiceProvider.GetRequiredService<TurnFlowCommandHandler>();

        Assert.False((await turnFlow.EndTurnAsync(gameId, "p2")).IsSuccess);
        Assert.False((await turnFlow.ForceAdvanceToFortifyAsync(gameId, "p2")).IsSuccess);
        Assert.NotNull((await LoadAsync(factory, gameId)).EventRound.PendingAttrition);
    }

    /// <summary>
    /// Griepgolf (2 legers) met twee kiezers die tegelijk bevestigen: beide keuzes slagen en de
    /// volgende beurt start precies één keer (FO §9.2, retry bij een gelijktijdige append).
    /// </summary>
    [Fact]
    public async Task Attrition_TweeGelijktijdigeLaatsteKeuzes_StartenPreciesEenBeurt()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var alice = await ApiTestHost.ConnectAsync(factory, client);
        await using var bob = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, drawPile: ["griepgolf"], alaskaArmies: 5, albertaArmies: 5);
        await bob.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2");

        await Task.WhenAll(
            alice.InvokeAsync<GameStateDto>("RemoveArmies", gameId, "p1", new Dictionary<string, int> { ["alaska"] = 2 }),
            bob.InvokeAsync<GameStateDto>("RemoveArmies", gameId, "p2", new Dictionary<string, int> { ["alberta"] = 2 }));

        var state = await LoadAsync(factory, gameId);
        Assert.Null(state.EventRound.PendingAttrition);
        Assert.Equal("p1", state.TurnState!.ActivePlayerId);
        Assert.Equal(3, state.Territory("alaska").ArmyCount);
        Assert.Equal(3, state.Territory("alberta").ArmyCount);

        await using var session = factory.Services.GetRequiredService<IDocumentStore>().QuerySession();
        var events = (await session.Events.FetchStreamAsync(gameId)).Select(@event => @event.Data).ToArray();
        var afterAttrition = events.SkipWhile(@event => @event is not AttritionStarted).ToArray();
        Assert.Single(afterAttrition.OfType<PhaseChanged>());
        Assert.Equal(2, afterAttrition.OfType<ArmiesRemoved>().Count());
    }
}
