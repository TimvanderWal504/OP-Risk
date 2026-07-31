using System.Net.Http.Json;
using Marten;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Api;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.State;

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

            // De eerste 2 waarden gaan naar StartGame's missietoewijzing (WinCondition.
            // SecretMissions, 2 spelers = 2 trekkingen); daarna wint Alice de order-roll
            // altijd meteen (10 tegen 5), zodat TurnOrder vaststaat.
            builder.ConfigureServices(services =>
                services.AddSingleton<IRandomSource>(new SequenceRandomSource(0, 1, 6, 4, 3, 2)));
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
        Assert.Equal(alice.PlayerId, bobRoll.State.SetupState?.ActivePlayerId);

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

        Assert.Contains("setup.notYourTurnToClaim", exception.Message);
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

        Assert.Contains("setup.territoryAlreadyClaimed", exception.Message);
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

            if (i < territoryIds.Length - 1)
            {
                Assert.Equal(turnOrder[(i + 1) % turnOrder.Length], latest.SetupState?.ActivePlayerId);
            }

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
        Assert.Equal(aliceId, latest.SetupState?.ActivePlayerId);

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

        Assert.Contains("setup.notYourTurnToPlace", exception.Message);
    }

    private static readonly GameSettingsDto RandomSetupSettings = new(
        WinConditionDto.WorldDomination,
        SetupModeDto.Random,
        StartingArmies,
        TurnTimerSeconds: 180,
        FortifyTimerSeconds: 60,
        RolesEnabled: true,
        RoleAssignment: RoleAssignmentModeDto.Random,
        EventsEnabled: false);

    /// <summary>
    /// Dwingt alleen de roltoewijzing (2 trekkingen, welke rol precies uitkomt maakt niet
    /// uit voor deze test) en de order-roll-winnaar (Alice wint altijd, 10 tegen 5, zelfde
    /// als <see cref="CreateFactory"/>) op een vaste uitkomst. Alles daarna — de
    /// gebiedsverdeling, tot 43 trekkingen met krimpende bereiken — loopt bewust op echte
    /// willekeur door: dit scenario bewijst invarianten (alles verdeeld, max. 1 verschil
    /// tussen spelers, geen eigen rol-herkomstland), geen exacte uitkomst, en 43 trekkingen
    /// met de hand voorberekenen is niet haalbaar/onderhoudbaar.
    /// </summary>
    private WebApplicationFactory<Program> CreateRandomModeFactory() =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Postgres"] = postgres.ConnectionString,
                }));

            builder.ConfigureServices(services =>
                services.AddSingleton<IRandomSource>(
                    new PrefixThenRandomSource(new SystemRandomSource(), 0, 1, 6, 4, 3, 2)));
        });

    /// <summary>
    /// FO §5.1 (Random-startopstelling) end-to-end: na de order-roll-winnaar moet
    /// <see cref="GamePhaseDto.InitialPlacement"/> binnenkomen met alle 43 gebieden al
    /// verdeeld — dit was de eerste bug die deze taak blootlegde (leeg
    /// <c>PlaceInitialArmyStep</c> op de telefoon). Dekt ook de rolrestrictie (FO §5.1/§8.1)
    /// end-to-end: bevestigt dat de command handler de calculator-uitkomst ongewijzigd
    /// doorzet naar de geappende events/DTO, niet alleen dat de calculator zelf 'm respecteert
    /// (dat is al los unit-getest, <c>TerritoryAssignmentCalculatorTests</c>).
    /// </summary>
    [Fact]
    public async Task VolledigeStartopstelling_MetSetupModeRandom_VerdeeltAlleGebiedenZonderEigenRolHerkomstland()
    {
        await using var factory = CreateRandomModeFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var createResponse = await client.PostAsJsonAsync(
            "/games", new CreateGameRequest("standaard-43", RandomSetupSettings));
        createResponse.EnsureSuccessStatusCode();
        var gameId = (await createResponse.Content.ReadFromJsonAsync<CreateGameResponse>())!.GameId;

        var alice = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, alice.PlayerId, "red");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, bob.PlayerId, "blue");
        await connection.InvokeAsync<GameStateDto>("StartGame", gameId, alice.PlayerId);

        await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, alice.PlayerId);
        var bobRoll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bob.PlayerId);
        var state = bobRoll.State;

        Assert.Equal(GamePhaseDto.InitialPlacement, state.Phase);
        Assert.Null(state.SetupState?.ActivePlayerId);
        Assert.All(state.Territories, territory => Assert.NotNull(territory.OwnerPlayerId));
        Assert.All(state.Territories, territory => Assert.Equal(1, territory.ArmyCount));

        var territoryCountByPlayer = state.Territories
            .GroupBy(territory => territory.OwnerPlayerId!)
            .ToDictionary(group => group.Key, group => group.Count());

        Assert.Equal(new HashSet<string> { alice.PlayerId, bob.PlayerId }, territoryCountByPlayer.Keys.ToHashSet());
        Assert.Equal(state.Territories.Count, territoryCountByPlayer.Values.Sum());
        Assert.True(territoryCountByPlayer.Values.Max() - territoryCountByPlayer.Values.Min() <= 1);

        foreach (var player in state.Players)
        {
            if (player.RoleId is null)
            {
                continue;
            }

            var originTerritoryId = state.Roles.First(role => role.Id == player.RoleId).OriginTerritory;
            var originOwnerId = state.Territories.First(territory => territory.TerritoryId == originTerritoryId)
                .OwnerPlayerId;

            Assert.NotEqual(player.Id, originOwnerId);
        }
    }

    /// <summary>
    /// FO §5.1: bij Random-startopstelling mag een speler plaatsen zonder op zijn beurt te
    /// wachten — dit bewijst het end-to-end door de speler die niet vooraan in
    /// <see cref="GameStateDto.TurnOrder"/> staat (Bob, want Alice wint de order-roll altijd
    /// in <see cref="CreateRandomModeFactory"/>) als eerste te laten plaatsen, zonder dat
    /// Alice ooit heeft geplaatst.
    /// </summary>
    [Fact]
    public async Task PlaceInitialArmy_BijRandom_SpelerNietVoorinBeurtvolgorde_MagDirectPlaatsen()
    {
        await using var factory = CreateRandomModeFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var createResponse = await client.PostAsJsonAsync(
            "/games", new CreateGameRequest("standaard-43", RandomSetupSettings));
        createResponse.EnsureSuccessStatusCode();
        var gameId = (await createResponse.Content.ReadFromJsonAsync<CreateGameResponse>())!.GameId;

        var alice = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, alice.PlayerId, "red");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, bob.PlayerId, "blue");
        await connection.InvokeAsync<GameStateDto>("StartGame", gameId, alice.PlayerId);

        await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, alice.PlayerId);
        var bobRoll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bob.PlayerId);
        var state = bobRoll.State;

        Assert.Equal([alice.PlayerId, bob.PlayerId], state.TurnOrder);

        var bobTerritoryId = state.Territories.First(territory => territory.OwnerPlayerId == bob.PlayerId).TerritoryId;

        var afterBobPlaces = await connection.InvokeAsync<GameStateDto>(
            "PlaceInitialArmy", gameId, bob.PlayerId, bobTerritoryId);

        Assert.Equal(2, afterBobPlaces.Territories.First(t => t.TerritoryId == bobTerritoryId).ArmyCount);
    }

    /// <summary>
    /// FO §5.1: bij Random faalt plaatsen zodra het eigen budget op is
    /// (<c>setup.noArmiesLeftToPlace</c>, niet de beurt-gebonden foutcode), terwijl de andere
    /// speler intussen gewoon door kan plaatsen.
    /// </summary>
    [Fact]
    public async Task PlaceInitialArmy_BijRandom_ZonderBudget_GeeftNoArmiesLeftFoutcode()
    {
        await using var factory = CreateRandomModeFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var createResponse = await client.PostAsJsonAsync(
            "/games", new CreateGameRequest("standaard-43", RandomSetupSettings));
        createResponse.EnsureSuccessStatusCode();
        var gameId = (await createResponse.Content.ReadFromJsonAsync<CreateGameResponse>())!.GameId;

        var alice = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, alice.PlayerId, "red");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, bob.PlayerId, "blue");
        await connection.InvokeAsync<GameStateDto>("StartGame", gameId, alice.PlayerId);

        await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, alice.PlayerId);
        var bobRoll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bob.PlayerId);
        var state = bobRoll.State;

        var aliceTerritoryId = state.Territories.First(t => t.OwnerPlayerId == alice.PlayerId).TerritoryId;
        var aliceTerritoryCount = state.Territories.Count(t => t.OwnerPlayerId == alice.PlayerId);
        var aliceBudget = StartingArmies - aliceTerritoryCount;

        GameStateDto latest = state;

        for (var i = 0; i < aliceBudget; i++)
        {
            latest = await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, alice.PlayerId, aliceTerritoryId);
        }

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, alice.PlayerId, aliceTerritoryId));
        Assert.Contains("setup.noArmiesLeftToPlace", exception.Message);

        var bobTerritoryId = latest.Territories.First(t => t.OwnerPlayerId == bob.PlayerId).TerritoryId;
        var afterBobPlaces = await connection.InvokeAsync<GameStateDto>(
            "PlaceInitialArmy", gameId, bob.PlayerId, bobTerritoryId);

        Assert.Equal(2, afterBobPlaces.Territories.First(t => t.TerritoryId == bobTerritoryId).ArmyCount);
    }

    /// <summary>
    /// Legt vast (lost niet op) wat er gebeurt als twee spelers, elk met precies 1 leger over,
    /// letterlijk gelijktijdig hun laatste startleger plaatsen bij Random — het scenario waarbij
    /// beide requests <c>totalArmiesPlaced == totalArmiesExpected</c> zouden kunnen zien en dus
    /// allebei proberen de fase naar Reinforce te schuiven (zie het plan-document,
    /// "Geverifieerde randgevallen · Concurrency"). Twee aparte <see cref="HubConnection"/>-
    /// instanties (niet één gedeelde) zodat elke aanroep, net als in productie, zijn eigen
    /// scoped <c>IDocumentSession</c> krijgt i.p.v. een sessie-reentrancy-exceptie te forceren
    /// die niets over het echte race-gedrag zegt.
    /// </summary>
    [Fact]
    public async Task PlaceInitialArmy_BijRandom_TweeSpelersGelijktijdigLaatsteLeger_LegtHuidigGedragVast()
    {
        await using var factory = CreateRandomModeFactory();
        using var aliceClient = factory.CreateClient();
        using var bobClient = factory.CreateClient();
        await using var aliceConnection = await ConnectAsync(factory, aliceClient);
        await using var bobConnection = await ConnectAsync(factory, bobClient);

        var createResponse = await aliceClient.PostAsJsonAsync(
            "/games", new CreateGameRequest("standaard-43", RandomSetupSettings));
        createResponse.EnsureSuccessStatusCode();
        var gameId = (await createResponse.Content.ReadFromJsonAsync<CreateGameResponse>())!.GameId;

        var alice = await aliceConnection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await bobConnection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");
        await aliceConnection.InvokeAsync<GameStateDto>("ChooseColor", gameId, alice.PlayerId, "red");
        await bobConnection.InvokeAsync<GameStateDto>("ChooseColor", gameId, bob.PlayerId, "blue");
        await aliceConnection.InvokeAsync<GameStateDto>("StartGame", gameId, alice.PlayerId);

        await aliceConnection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, alice.PlayerId);
        var bobRoll = await bobConnection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bob.PlayerId);
        var state = bobRoll.State;

        var aliceTerritoryId = state.Territories.First(t => t.OwnerPlayerId == alice.PlayerId).TerritoryId;
        var aliceBudget = StartingArmies - state.Territories.Count(t => t.OwnerPlayerId == alice.PlayerId);
        var bobTerritoryId = state.Territories.First(t => t.OwnerPlayerId == bob.PlayerId).TerritoryId;
        var bobBudget = StartingArmies - state.Territories.Count(t => t.OwnerPlayerId == bob.PlayerId);

        for (var i = 0; i < aliceBudget - 1; i++)
        {
            await aliceConnection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, alice.PlayerId, aliceTerritoryId);
        }

        for (var i = 0; i < bobBudget - 1; i++)
        {
            await bobConnection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, bob.PlayerId, bobTerritoryId);
        }

        // Beide spelers hebben nu precies 1 leger over — dit is de laatste plaatsing die
        // gezamenlijk totalArmiesPlaced == totalArmiesExpected doet omslaan.
        Exception? aliceFailure = null;
        Exception? bobFailure = null;

        var aliceTask = aliceConnection
            .InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, alice.PlayerId, aliceTerritoryId)
            .ContinueWith(t => aliceFailure = t.Exception?.InnerException);
        var bobTask = bobConnection
            .InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, bob.PlayerId, bobTerritoryId)
            .ContinueWith(t => bobFailure = t.Exception?.InnerException);

        await Task.WhenAll(aliceTask, bobTask);

        // Verwacht gedrag (redenering, NIET zelf uitgevoerd — CLAUDE.md: unittests draait de
        // gebruiker): Marten's uniek-per-stream-versienummer zou de tweede append gewoon na de
        // eerste moeten laten plaatsvinden i.p.v. botsen, dus geen dubbele PhaseChanged en geen
        // exceptie bij beide spelers. Dit is een voorspelling op basis van de architectuur
        // (ProjectionLifecycle.Inline, geen expected-version-check), geen geverifieerd feit.
        // Faalt deze assertie bij de eerste echte testrun, dan is dát de bevinding — de
        // assertie aanpassen aan het werkelijke gedrag, niet aan de aanname hier.
        Assert.Null(aliceFailure);
        Assert.Null(bobFailure);

        var final = await aliceConnection.InvokeAsync<GameStateDto>("RejoinGame", gameId, alice.PlayerId);
        Assert.Equal(GamePhaseDto.InProgress, final.Phase);
    }

    /// <summary>
    /// De eerste beurt is van de eerste speler in de beurtvolgorde, en zíjn versterkingen
    /// horen op het <c>PhaseChanged</c>-event te staan — niet die van wie toevallig het
    /// laatste startleger plaatste. Bij <see cref="SetupModeDto.Random"/> plaatst iedereen
    /// tegelijk, dus die laatste kan elke speler zijn. De twee spelers krijgen hier bewust een
    /// óngelijk gebiedsbezit (p1 heel Australië: 5 gebieden + continentbonus 3 = 6; p2 één
    /// gebied: het minimum van 3), anders levert de verkeerde speler dezelfde uitkomst op en
    /// blijft de test groen op een bug.
    /// </summary>
    [Fact]
    public async Task LaatsteStartleger_ZetDeVersterkingenVanDeEersteSpelerInDeVolgorde()
    {
        const int startingArmies = 6;

        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");

        var settings = new GameSettings(
            WinCondition.WorldDomination,
            SetupMode.Random,
            startingArmies,
            TurnTimer: TimeSpan.FromMinutes(3),
            FortifyTimer: TimeSpan.FromMinutes(1),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        // p1 heeft zijn 6 legers al geplaatst (2+1+1+1+1), p2 heeft er nog één over.
        var australia = new Dictionary<string, int>
        {
            ["indonesia"] = 2,
            ["new-guinea"] = 1,
            ["western-australia"] = 1,
            ["eastern-australia"] = 1,
            ["new-zealand"] = 1,
        };

        var territories = map.Territories
            .Select(territory => australia.TryGetValue(territory.Id, out var armies)
                ? new TerritoryOwnership(territory.Id, "p1", armies)
                : territory.Id == "alaska"
                    ? new TerritoryOwnership(territory.Id, "p2", ArmyCount: startingArmies - 1)
                    : new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0))
            .ToArray();

        var state = new GameState(
            gameId,
            map,
            GamePhase.InitialPlacement,
            settings,
            players:
            [
                new Player("p1", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false),
                new Player("p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false),
            ],
            territories,
            turnOrder: ["p1", "p2"],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();
        await store.Storage.ApplyAllConfiguredChangesToDatabaseAsync();

        await using (var session = store.LightweightSession())
        {
            session.Store(state);
            await session.SaveChangesAsync();
        }

        var updated = await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, "p2", "alaska");

        Assert.Equal(GamePhaseDto.InProgress, updated.Phase);
        Assert.Equal("p1", updated.TurnState!.ActivePlayerId);
        Assert.Equal(6, updated.TurnState.ArmiesRemaining);
    }

    /// <summary>
    /// Geeft een vaste reeks terug totdat die op is, en valt daarna terug op
    /// <paramref name="fallback"/> — hier <see cref="SystemRandomSource"/>, zodat alleen de
    /// roltoewijzing en de order-roll gecontroleerd zijn en de rest (de gebiedsverdeling)
    /// op echte willekeur draait. Geen bereik-validatie zoals <see cref="SequenceRandomSource"/>:
    /// de aanroeper is zelf verantwoordelijk voor een geldig vast voorvoegsel.
    /// </summary>
    private sealed class PrefixThenRandomSource(IRandomSource fallback, params int[] prefix) : IRandomSource
    {
        private int _index;

        public int Next(int minInclusive, int maxExclusive) =>
            _index < prefix.Length ? prefix[_index++] : fallback.Next(minInclusive, maxExclusive);
    }
}
