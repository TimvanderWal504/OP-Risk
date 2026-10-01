using Marten;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;
using RiskGame.Api.Services;
using RiskGame.Persistence.Map;
using RiskGame.Persistence.Sessions;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// <c>SetAutoPass</c> en de host-uitval (FO §11.1/§11.2, TO §4.1): alleen de host, alleen vanaf zijn
/// eigen verbinding, en wat er op de speler wachtte wordt meteen afgehandeld — zijn verdediging, zijn
/// legerverlies-keuze of zijn eigen beurt, waarbij een lopend gevecht eerst wordt uitgespeeld.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubSetAutoPassTests(PostgresFixture postgres)
{
    private static readonly string[] NorthAmerica =
    [
        "alaska", "northwest-territory", "greenland", "alberta", "ontario", "quebec",
        "western-united-states", "eastern-united-states", "central-america",
    ];

    private static readonly string[] SouthAmerica = ["venezuela", "peru", "brazil", "argentina"];

    private static string TokenOf(string playerId) => $"token-{playerId}";

    private WebApplicationFactory<Program> CreateFactory(FakeTimeProvider? clock = null, params int[] dice) =>
        ApiTestHost.Create(
            postgres,
            services =>
            {
                services.AddSingleton<IRandomSource>(new SequenceRandomSource(dice));

                if (clock is not null)
                {
                    services.AddSingleton<TimeProvider>(clock);
                }
            });

    /// <summary>
    /// Drie spelers, beurtvolgorde p1 → p2 → p3; p1 is host. p1 bezit Noord-Amerika, p2 Zuid-Amerika,
    /// p3 de rest, elk gebied 3 legers. Elke speler heeft een sessietoken, zodat een verbinding zich als
    /// die speler kan melden.
    /// </summary>
    private static async Task<string> SetUpAsync(
        WebApplicationFactory<Program> factory,
        string activePlayerId = "p2",
        TurnPhase turnPhase = TurnPhase.Attack,
        int armiesRemaining = 0,
        PendingAttrition? pendingAttrition = null,
        GamePhase phase = GamePhase.InProgress,
        bool hostEliminated = false,
        IReadOnlyDictionary<string, int>? armies = null,
        string? bobRoleId = null)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var map = factory.Services.GetRequiredService<IMapDefinitionSource>().Load("standaard-43");
        var now = factory.Services.GetRequiredService<TimeProvider>().GetUtcNow();

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            StartingArmiesPresetId: "classic",
            TurnTimer: TimeSpan.FromMinutes(3),
            FortifyTimer: TimeSpan.FromMinutes(1),
            RolesEnabled: bobRoleId is not null,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        // Met een rol bezit Bob ook China: het herkomstland van "generaal" (Reroll).
        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(
                territory.Id,
                NorthAmerica.Contains(territory.Id) ? "p1"
                    : SouthAmerica.Contains(territory.Id) || (bobRoleId is not null && territory.Id == "china") ? "p2"
                    : "p3",
                armies?.GetValueOrDefault(territory.Id, 3) ?? 3))
            .ToArray();

        var state = new GameState(
            gameId,
            map,
            phase,
            settings,
            players:
            [
                new Player("p1", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: hostEliminated, IsHost: true),
                new Player("p2", "Bob", "blue", Hand: [], RoleId: bobRoleId, Mission: null, IsEliminated: false),
                new Player("p3", "Carol", "green", Hand: [], RoleId: null, Mission: null, IsEliminated: false),
            ],
            territories,
            turnOrder: ["p1", "p2", "p3"],
            turnState: pendingAttrition is null
                ? new TurnState(activePlayerId, turnPhase, new PhaseTimer(settings.TurnTimer, now), PendingCombat: null,
                    ArmiesRemaining: armiesRemaining)
                : null,
            deck: new DeckState(DrawPile: map.Deck, DiscardPile: [], NextTradeValue: 4),
            activeEffects: [],
            eventRound: pendingAttrition is null
                ? EventRoundState.Empty
                : EventRoundState.Empty with { CurrentEventId = pendingAttrition.EventId, PendingAttrition = pendingAttrition });

        await using var session = factory.Services.GetRequiredService<IDocumentStore>().LightweightSession();
        session.Store(state);

        foreach (var playerId in new[] { "p1", "p2", "p3" })
        {
            session.Store(new PlayerSessionToken(playerId, gameId, TokenOf(playerId)));
        }

        await session.SaveChangesAsync();

        return gameId;
    }

    private static async Task<HubConnection> ConnectAsAsync(
        WebApplicationFactory<Program> factory, HttpClient client, string gameId, string playerId)
    {
        var connection = await ApiTestHost.ConnectAsync(factory, client);
        await connection.InvokeAsync<GameStateDto>("RejoinGame", gameId, playerId, TokenOf(playerId));

        return connection;
    }

    private static async Task<GameState> LoadAsync(WebApplicationFactory<Program> factory, string gameId)
    {
        await using var session = factory.Services.GetRequiredService<IDocumentStore>().QuerySession();

        return (await session.LoadAsync<GameState>(gameId))!;
    }

    [Fact]
    public async Task SetAutoPass_VanafEenVerbindingDieNietVanDeHostIs_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(factory);
        await using var bob = await ConnectAsAsync(factory, client, gameId, "p2");

        // Bob kent het publieke id van de host, maar zijn verbinding hoort niet bij p1.
        var exception = await Assert.ThrowsAsync<HubException>(() =>
            bob.InvokeAsync<GameStateDto>("SetAutoPass", gameId, "p1", "p3"));

        Assert.Contains("common.notYourConnection", exception.Message);
        Assert.False((await LoadAsync(factory, gameId)).Player("p3").IsAutoPass);
    }

    [Fact]
    public async Task SetAutoPass_DoorEenSpelerDieGeenHostIs_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(factory);
        await using var bob = await ConnectAsAsync(factory, client, gameId, "p2");

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            bob.InvokeAsync<GameStateDto>("SetAutoPass", gameId, "p2", "p3"));

        Assert.Contains("lobby.notHost", exception.Message);
    }

    /// <summary>FO §11.2: wacht een gevecht op de verdediger, dan verdedigt de server meteen.</summary>
    [Fact]
    public async Task SetAutoPass_OpEenVerdedigerWaaropEenGevechtWacht_VerdedigtMeteen()
    {
        // Aanval 6 en 6, verdediging 1 en 1: de verdediger verliest er twee.
        await using var factory = CreateFactory(dice: [6, 6, 1, 1]);
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(factory, activePlayerId: "p3");
        await using var host = await ConnectAsAsync(factory, client, gameId, "p1");
        await using var carol = await ConnectAsAsync(factory, client, gameId, "p3");

        var narrated = new TaskCompletionSource<CombatNarratedMessage>();
        host.On<CombatNarratedMessage>("CombatNarrated", message => narrated.TrySetResult(message));

        await carol.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p3", "north-africa", "brazil", 2);
        Assert.NotNull((await LoadAsync(factory, gameId)).TurnState!.PendingCombat);

        await host.InvokeAsync<GameStateDto>("SetAutoPass", gameId, "p1", "p2");

        var state = await LoadAsync(factory, gameId);
        Assert.True(state.Player("p2").IsAutoPass);
        Assert.Null(state.TurnState!.PendingCombat);
        Assert.Equal(1, state.Territory("brazil").ArmyCount);
        Assert.Equal("p2", (await narrated.Task.WaitAsync(TimeSpan.FromSeconds(5))).DefenderId);
    }

    /// <summary>FO §9.2/§11.2: staat hij op de wachtlijst van legerverlies, dan kiest de server meteen.</summary>
    [Fact]
    public async Task SetAutoPass_OpDeLaatsteLegerverliesKiezer_KiestMeteenEnStartDeVolgendeBeurt()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(
            factory,
            pendingAttrition: new PendingAttrition("griepgolf", 2, ["p2"], ["p2"], NextPlayerId: "p3"),
            armies: new Dictionary<string, int> { ["venezuela"] = 6 });
        await using var host = await ConnectAsAsync(factory, client, gameId, "p1");

        await host.InvokeAsync<GameStateDto>("SetAutoPass", gameId, "p1", "p2");

        var state = await LoadAsync(factory, gameId);
        Assert.Null(state.EventRound.PendingAttrition);
        Assert.Equal(4, state.Territory("venezuela").ArmyCount);
        Assert.Equal("p3", state.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhase.Reinforce, state.TurnState.TurnPhase);
    }

    /// <summary>FO §11.2: is hij zelf aan de beurt, dan eindigt die; niet-geplaatste legers vervallen.</summary>
    [Fact]
    public async Task SetAutoPass_OpDeActieveSpelerInVersterken_EindigtZijnBeurt()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(factory, activePlayerId: "p2", turnPhase: TurnPhase.Reinforce, armiesRemaining: 5);
        await using var host = await ConnectAsAsync(factory, client, gameId, "p1");

        await host.InvokeAsync<GameStateDto>("SetAutoPass", gameId, "p1", "p2");

        var state = await LoadAsync(factory, gameId);
        Assert.Equal("p3", state.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhase.Reinforce, state.TurnState.TurnPhase);
        Assert.All(SouthAmerica, territoryId => Assert.Equal(3, state.Territory(territoryId).ArmyCount));
    }

    /// <summary>
    /// FO §11.2: een gevecht dat op een verdediger wacht die zelf kiest, wordt uitgespeeld — het spel
    /// wacht op die keuze, en die keuze maakt de beurt van de aanvaller op auto-pass af.
    /// </summary>
    [Fact]
    public async Task SetAutoPass_OpEenAanvallerWiensGevechtOpEenMensWacht_DeKeuzeMaaktDeBeurtAf()
    {
        // Aanval 1 en 1, verdediging 6 en 6: de aanvaller verliest er twee, geen verovering.
        await using var factory = CreateFactory(dice: [1, 1, 6, 6]);
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(factory, activePlayerId: "p2");
        await using var host = await ConnectAsAsync(factory, client, gameId, "p1");
        await using var bob = await ConnectAsAsync(factory, client, gameId, "p2");
        await using var carol = await ConnectAsAsync(factory, client, gameId, "p3");

        await bob.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p2", "brazil", "north-africa", 2);
        await host.InvokeAsync<GameStateDto>("SetAutoPass", gameId, "p1", "p2");

        var waiting = await LoadAsync(factory, gameId);
        Assert.Equal("p2", waiting.TurnState!.ActivePlayerId);
        Assert.NotNull(waiting.TurnState.PendingCombat);

        await carol.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p3", 2, false);

        var state = await LoadAsync(factory, gameId);
        Assert.Equal("p3", state.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhase.Reinforce, state.TurnState.TurnPhase);
    }

    /// <summary>
    /// FO §11.2: na een verovering verhuist het minimum mee, en wie deze beurt veroverde trekt nog zijn
    /// kaart.
    /// </summary>
    [Fact]
    public async Task SetAutoPass_OpEenAanvallerMetEenVeroveringZonderMeeverplaatsing_VerplaatstHetMinimumEnTrektEenKaart()
    {
        // Aanval 6, verdediging 1: Noord-Afrika (1 leger) valt.
        await using var factory = CreateFactory(dice: [6, 1]);
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(factory, activePlayerId: "p2", armies: new Dictionary<string, int> { ["north-africa"] = 1 });
        await using var host = await ConnectAsAsync(factory, client, gameId, "p1");
        await using var bob = await ConnectAsAsync(factory, client, gameId, "p2");
        await using var carol = await ConnectAsAsync(factory, client, gameId, "p3");

        await bob.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p2", "brazil", "north-africa", 1);
        await carol.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p3", 1, false);
        Assert.Equal("p2", (await LoadAsync(factory, gameId)).Territory("north-africa").OwnerPlayerId);

        await host.InvokeAsync<GameStateDto>("SetAutoPass", gameId, "p1", "p2");

        var state = await LoadAsync(factory, gameId);
        Assert.Equal(1, state.Territory("north-africa").ArmyCount);
        Assert.Equal(2, state.Territory("brazil").ArmyCount);
        Assert.Single(state.Player("p2").Hand);
        Assert.Equal("p3", state.TurnState!.ActivePlayerId);
    }

    /// <summary>
    /// Review taak 5 (M1): wacht de afgebroken beurt van een aanvaller op auto-pass op een verdediger
    /// die zelf óók op auto-pass gaat, dan verdedigt de server én maakt hij meteen de beurt af — niet
    /// pas na een timeout.
    /// </summary>
    [Fact]
    public async Task SetAutoPass_OpDeVerdedigerWaaropDeAfgebrokenBeurtWacht_MaaktDieBeurtMeteenAf()
    {
        // Aanval 1 en 1, verdediging 6 en 6: de aanvaller verliest er twee.
        await using var factory = CreateFactory(dice: [1, 1, 6, 6]);
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(factory, activePlayerId: "p2");
        await using var host = await ConnectAsAsync(factory, client, gameId, "p1");
        await using var bob = await ConnectAsAsync(factory, client, gameId, "p2");

        await bob.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p2", "brazil", "north-africa", 2);
        await host.InvokeAsync<GameStateDto>("SetAutoPass", gameId, "p1", "p2");
        await host.InvokeAsync<GameStateDto>("SetAutoPass", gameId, "p1", "p3");

        // Bobs beurt is af, Carols automatische beurt ook: Alice is aan de beurt.
        var state = await LoadAsync(factory, gameId);
        Assert.Equal(1, state.Territory("brazil").ArmyCount);
        Assert.Equal("p1", state.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhase.Reinforce, state.TurnState.TurnPhase);
    }

    /// <summary>FO §11.2: een openstaande herwerp-keuze wordt "Doorgaan"; daarna ligt het gevecht bij de verdediger.</summary>
    [Fact]
    public async Task SetAutoPass_OpEenAanvallerMetEenOpenHerwerpKeuze_GaatDoorEnWachtOpDeVerdediger()
    {
        await using var factory = CreateFactory(dice: [1, 1]);
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(factory, activePlayerId: "p2", bobRoleId: "generaal");
        await using var host = await ConnectAsAsync(factory, client, gameId, "p1");
        await using var bob = await ConnectAsAsync(factory, client, gameId, "p2");

        await bob.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p2", "brazil", "north-africa", 2);
        Assert.True((await LoadAsync(factory, gameId)).TurnState!.PendingCombat!.AwaitingRerollDecision);

        await host.InvokeAsync<GameStateDto>("SetAutoPass", gameId, "p1", "p2");

        var state = await LoadAsync(factory, gameId);
        Assert.Equal("p2", state.TurnState!.ActivePlayerId);
        Assert.False(state.TurnState.PendingCombat!.AwaitingRerollDecision);
    }

    // ---- host-uitval (FO §11.1) ----

    private static async Task DisconnectHostAsync(
        WebApplicationFactory<Program> factory, HubConnection host, string gameId)
    {
        var presence = factory.Services.GetRequiredService<PlayerPresenceRegistry>();
        await host.DisposeAsync();

        var deadline = DateTimeOffset.UtcNow.AddSeconds(5);
        while (presence.AbsentSince(gameId, "p1") is null && DateTimeOffset.UtcNow < deadline)
        {
            await Task.Delay(20);
        }

        Assert.NotNull(presence.AbsentSince(gameId, "p1"));
    }

    private static async Task CheckHostAbsenceAsync(WebApplicationFactory<Program> factory)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<HostAbsenceMonitor>().CheckOnceAsync();
    }

    [Fact]
    public async Task HostUitval_NaTweeMinutenZonderVerbinding_GaatDeHostOpAutoPassEnGaatHetHostSchapOver()
    {
        var clock = new FakeTimeProvider(new DateTimeOffset(2026, 10, 1, 20, 0, 0, TimeSpan.Zero));
        await using var factory = CreateFactory(clock);
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(factory, activePlayerId: "p3");
        var host = await ConnectAsAsync(factory, client, gameId, "p1");

        await DisconnectHostAsync(factory, host, gameId);

        clock.Advance(HostAbsenceMonitor.GracePeriod - TimeSpan.FromSeconds(1));
        await CheckHostAbsenceAsync(factory);
        Assert.True((await LoadAsync(factory, gameId)).Player("p1").IsHost);

        clock.Advance(TimeSpan.FromSeconds(1));
        await CheckHostAbsenceAsync(factory);

        var state = await LoadAsync(factory, gameId);
        Assert.True(state.Player("p1").IsAutoPass);
        Assert.False(state.Player("p1").IsHost);
        Assert.True(state.Player("p2").IsHost);

        // Komt de oude host terug, dan vervalt zijn auto-pass maar wordt hij niet opnieuw host.
        await using var hostAgain = await ConnectAsAsync(factory, client, gameId, "p1");

        var returned = await LoadAsync(factory, gameId);
        Assert.False(returned.Player("p1").IsAutoPass);
        Assert.False(returned.Player("p1").IsHost);
        Assert.True(returned.Player("p2").IsHost);
    }

    /// <summary>FO §11.1: een korte onderbreking telt niet.</summary>
    [Fact]
    public async Task HostUitval_DeHostVerbindtBinnenDeTweeMinutenOpnieuw_ErGebeurtNiets()
    {
        var clock = new FakeTimeProvider(new DateTimeOffset(2026, 10, 1, 20, 0, 0, TimeSpan.Zero));
        await using var factory = CreateFactory(clock);
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(factory, activePlayerId: "p3");
        var host = await ConnectAsAsync(factory, client, gameId, "p1");

        await DisconnectHostAsync(factory, host, gameId);
        clock.Advance(TimeSpan.FromMinutes(1));
        await using var hostAgain = await ConnectAsAsync(factory, client, gameId, "p1");
        clock.Advance(TimeSpan.FromMinutes(5));

        await CheckHostAbsenceAsync(factory);

        var state = await LoadAsync(factory, gameId);
        Assert.True(state.Player("p1").IsHost);
        Assert.False(state.Player("p1").IsAutoPass);
    }

    /// <summary>FO §11.1: een uitgeschakelde host draagt alleen over; hij speelt toch niet meer mee.</summary>
    [Fact]
    public async Task HostUitval_EenUitgeschakeldeHost_DraagtAlleenHetHostSchapOver()
    {
        var clock = new FakeTimeProvider(new DateTimeOffset(2026, 10, 1, 20, 0, 0, TimeSpan.Zero));
        await using var factory = CreateFactory(clock);
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(factory, activePlayerId: "p3", hostEliminated: true);
        var host = await ConnectAsAsync(factory, client, gameId, "p1");

        await DisconnectHostAsync(factory, host, gameId);
        clock.Advance(HostAbsenceMonitor.GracePeriod);
        await CheckHostAbsenceAsync(factory);

        var state = await LoadAsync(factory, gameId);
        Assert.False(state.Player("p1").IsAutoPass);
        Assert.True(state.Player("p2").IsHost);
    }

    /// <summary>Review taak 4: een afgelopen spel wordt uit de aanwezigheid gehaald.</summary>
    [Fact]
    public async Task HostUitval_InEenAfgelopenSpel_VergeetDeAfwezigeSpeler()
    {
        var clock = new FakeTimeProvider(new DateTimeOffset(2026, 10, 1, 20, 0, 0, TimeSpan.Zero));
        await using var factory = CreateFactory(clock);
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(factory, activePlayerId: "p3", phase: GamePhase.Finished);
        var host = await ConnectAsAsync(factory, client, gameId, "p1");

        await DisconnectHostAsync(factory, host, gameId);
        clock.Advance(HostAbsenceMonitor.GracePeriod);
        await CheckHostAbsenceAsync(factory);

        Assert.Null(factory.Services.GetRequiredService<PlayerPresenceRegistry>().AbsentSince(gameId, "p1"));
        Assert.True((await LoadAsync(factory, gameId)).Player("p1").IsHost);
    }

    /// <summary>
    /// FO §11.1/§11.2: valt de host weg terwijl hij zelf aan de beurt is, dan eindigt zijn beurt in
    /// dezelfde batch als de overdracht, en is de volgende speler aan de beurt — en host.
    /// </summary>
    [Fact]
    public async Task HostUitval_TerwijlDeHostAanDeBeurtIs_EindigtZijnBeurtEnIsDeVolgendeHostEnAanDeBeurt()
    {
        var clock = new FakeTimeProvider(new DateTimeOffset(2026, 10, 1, 20, 0, 0, TimeSpan.Zero));
        await using var factory = CreateFactory(clock);
        using var client = factory.CreateClient();
        var gameId = await SetUpAsync(factory, activePlayerId: "p1", turnPhase: TurnPhase.Reinforce, armiesRemaining: 3);
        var host = await ConnectAsAsync(factory, client, gameId, "p1");

        await DisconnectHostAsync(factory, host, gameId);
        clock.Advance(HostAbsenceMonitor.GracePeriod);
        await CheckHostAbsenceAsync(factory);

        var state = await LoadAsync(factory, gameId);
        Assert.True(state.Player("p1").IsAutoPass);
        Assert.True(state.Player("p2").IsHost);
        Assert.Equal("p2", state.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhase.Reinforce, state.TurnState.TurnPhase);
    }
}
