using Marten;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Map;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// De automatische beurt van een speler op auto-pass (FO §11.2, TO §5.2): versterken over de
/// frontgebieden, verplicht inleggen, geen aanval of verplaatsing, en door naar de volgende speler —
/// ook op de rondegrens en in een laatste-kans-venster. Auto-pass wordt hier rechtstreeks in de
/// state gezet; het commando daarvoor komt in een latere taak.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubAutoPassTurnTests(PostgresFixture postgres)
{
    private static readonly string[] NorthAmerica =
    [
        "alaska", "northwest-territory", "greenland", "alberta", "ontario", "quebec",
        "western-united-states", "eastern-united-states", "central-america",
    ];

    private static readonly string[] SouthAmerica = ["venezuela", "peru", "brazil", "argentina"];

    private WebApplicationFactory<Program> CreateFactory() =>
        ApiTestHost.Create(postgres, services => services.AddSingleton<IRandomSource>(new SequenceRandomSource()));

    /// <summary>
    /// Drie spelers, beurtvolgorde p1 → p2 → p3. p1 bezit Noord-Amerika, p2 Zuid-Amerika, p3 de rest
    /// (elk gebied 1 leger). <paramref name="activePlayerId"/> staat in Verplaatsen, zodat diens
    /// <c>EndTurn</c> de volgende beurt start. Voor p2 zijn de frontgebieden Venezuela, Peru en
    /// Brazilië; Argentinië is achterland. Zijn versterking is 3 + 2 (Zuid-Amerika) = 5.
    /// </summary>
    private static async Task<string> SetUpAsync(
        WebApplicationFactory<Program> factory,
        string activePlayerId = "p1",
        IReadOnlyList<string>? autoPassPlayerIds = null,
        bool eventsEnabled = false,
        IReadOnlyList<string>? eventDrawPile = null,
        MissionWinTiming missionWinTiming = MissionWinTiming.EndOfTurn,
        string? p3MissionId = null,
        PendingWin? pendingWin = null,
        Func<MapDefinition, IReadOnlyList<Card>>? p2Hand = null)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var map = factory.Services.GetRequiredService<IMapDefinitionSource>().Load("standaard-43");
        var autoPass = autoPassPlayerIds ?? [];

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            StartingArmiesPresetId: "classic",
            TurnTimer: TimeSpan.FromMinutes(3),
            FortifyTimer: TimeSpan.FromMinutes(1),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: eventsEnabled,
            MissionWinTiming: missionWinTiming);

        Player PlayerFor(string id, string name, string color, IReadOnlyList<Card> hand, string? missionId) =>
            new(id, name, color, hand, RoleId: null,
                Mission: missionId is null ? null : map.Missions.Single(mission => mission.Id == missionId),
                IsEliminated: false, IsHost: id == "p1", IsAutoPass: autoPass.Contains(id));

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(
                territory.Id,
                NorthAmerica.Contains(territory.Id) ? "p1" : SouthAmerica.Contains(territory.Id) ? "p2" : "p3",
                ArmyCount: 1))
            .ToArray();

        var state = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            settings,
            players:
            [
                PlayerFor("p1", "Alice", "red", [], null),
                PlayerFor("p2", "Bob", "blue", p2Hand?.Invoke(map) ?? [], null),
                PlayerFor("p3", "Carol", "green", [], p3MissionId),
            ],
            territories,
            turnOrder: ["p1", "p2", "p3"],
            turnState: new TurnState(
                activePlayerId, TurnPhase.Fortify, new PhaseTimer(settings.FortifyTimer, DateTimeOffset.UtcNow),
                PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: [],
            pendingWin: pendingWin,
            eventRound: EventRoundState.Empty with { DrawPile = eventDrawPile ?? [] });

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

    private static int Armies(GameState state, string territoryId) => state.Territory(territoryId).ArmyCount;

    [Fact]
    public async Task EndTurn_VolgendeSpelerOpAutoPass_SpeeltZijnBeurtAutomatischEnGaatDoor()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, autoPassPlayerIds: ["p2"]);

        await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        var state = await LoadAsync(factory, gameId);
        Assert.Equal("p3", state.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhase.Reinforce, state.TurnState.TurnPhase);

        // 5 legers om de beurt over Venezuela, Peru en Brazilië; Argentinië is achterland.
        Assert.Equal(3, Armies(state, "venezuela"));
        Assert.Equal(3, Armies(state, "peru"));
        Assert.Equal(2, Armies(state, "brazil"));
        Assert.Equal(1, Armies(state, "argentina"));
    }

    [Fact]
    public async Task EndTurn_TweeAutoPassSpelersAchterElkaar_KomtWeerBijDeEersteSpelerUit()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, autoPassPlayerIds: ["p2", "p3"]);

        await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        var state = await LoadAsync(factory, gameId);
        Assert.Equal("p1", state.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhase.Reinforce, state.TurnState.TurnPhase);
        Assert.Equal(3, Armies(state, "venezuela"));
        Assert.True(state.TerritoriesOf("p3").Sum(territory => territory.ArmyCount) > 30);
    }

    /// <summary>FO §11.2: bij 5 of meer kaarten legt de server in, anders dan bij een verlopen timer.</summary>
    [Fact]
    public async Task EndTurn_AutoPassSpelerMetVijfKaarten_LegtVerplichtIn()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(
            factory,
            autoPassPlayerIds: ["p2"],
            p2Hand: map =>
            {
                var bySymbol = map.Deck.Where(card => !card.IsJoker).GroupBy(card => card.Symbol).ToArray();
                return [.. bySymbol[0].Take(3), .. bySymbol[1].Take(2)];
            });

        await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        var state = await LoadAsync(factory, gameId);
        Assert.Equal(2, state.Player("p2").Hand.Count);
        Assert.Equal(3, state.Deck.DiscardPile.Count);
        Assert.Equal(6, state.Deck.NextTradeValue);
        Assert.Equal("p3", state.TurnState!.ActivePlayerId);
    }

    /// <summary>
    /// FO §9.2/§11.2: de automatische beurt telt mee voor de rondegrens, en een net getrokken bonus
    /// komt in zijn eigen versterkingen.
    /// </summary>
    [Fact]
    public async Task EndTurn_AutoPassSpelerNaDeRondegrens_KrijgtDeNetGetrokkenBonus()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(
            factory, activePlayerId: "p3", autoPassPlayerIds: ["p1"], eventsEnabled: true, eventDrawPile: ["babyboom"]);

        await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p3");

        var state = await LoadAsync(factory, gameId);
        Assert.Equal("babyboom", state.EventRound.CurrentEventId);
        Assert.Equal("p2", state.TurnState!.ActivePlayerId);
        Assert.Equal(0, state.Player("p1").PendingEventBonus);

        var granted = state.RecentActions.Single(action =>
            action.Kind == RecentActionKind.ReinforcementsGranted && action.PlayerId == "p1");
        Assert.Equal(2, granted.EventBonus);
    }

    /// <summary>FO §6.2: wie op auto-pass staat, telt in een lopend venster als "al geweest".</summary>
    [Fact]
    public async Task EndTurn_LaatsteKansVensterMetAlleenNogEenAutoPassSpeler_IsGewonnen()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(
            factory,
            autoPassPlayerIds: ["p2"],
            missionWinTiming: MissionWinTiming.StartOfNextTurn,
            p3MissionId: "territory-24",
            pendingWin: new PendingWin("p3", "territory-24", ["p1", "p2"]));

        await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        var state = await LoadAsync(factory, gameId);
        Assert.Equal(GamePhase.Finished, state.Phase);
        Assert.Equal(["p3"], state.Winners);
    }

    /// <summary>FO §6.2: staan alle tegenstanders op auto-pass, dan opent geen venster maar wint de missiehouder.</summary>
    [Fact]
    public async Task EndTurn_MissieVervuldTerwijlAlleTegenstandersOpAutoPassStaan_WintMeteen()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(
            factory,
            activePlayerId: "p3",
            autoPassPlayerIds: ["p1", "p2"],
            missionWinTiming: MissionWinTiming.StartOfNextTurn,
            p3MissionId: "territory-24");

        await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p3");

        var state = await LoadAsync(factory, gameId);
        Assert.Equal(GamePhase.Finished, state.Phase);
        Assert.Equal(["p3"], state.Winners);
    }

    /// <summary>Zonder auto-pass opent hetzelfde scenario gewoon een laatste-kans-venster (controle op de test hierboven).</summary>
    [Fact]
    public async Task EndTurn_MissieVervuldZonderAutoPass_OpentHetVenster()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(
            factory,
            activePlayerId: "p3",
            missionWinTiming: MissionWinTiming.StartOfNextTurn,
            p3MissionId: "territory-24");

        await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p3");

        var state = await LoadAsync(factory, gameId);
        Assert.Equal(GamePhase.InProgress, state.Phase);
        Assert.Equal(["p1", "p2"], state.PendingWin!.RemainingPlayerIds);
    }
}
