using System.Net.Http.Json;
using Marten;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
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
    // Classic-preset, 2 spelers (data/starting-armies-presets.json): 40 startlegers.
    private const int StartingArmies = 40;

    private static readonly GameSettingsDto Settings = new(
        WinConditionDto.SecretMissions,
        SetupModeDto.Claiming,
        StartingArmiesPresetId: "classic",
        TurnTimerSeconds: 180,
        FortifyTimerSeconds: 60,
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentModeDto.Random,
        EventsEnabled: false);

    // De eerste 2 waarden gaan naar StartGame's missietoewijzing (WinCondition.SecretMissions,
    // 2 spelers = 2 trekkingen); daarna wint Alice de order-roll altijd meteen (10 tegen 5),
    // zodat TurnOrder vaststaat.
    private WebApplicationFactory<Program> CreateFactory() =>
        ApiTestHost.Create(
            postgres,
            services => services.AddSingleton<IRandomSource>(new SequenceRandomSource(0, 1, 6, 4, 3, 2)));

    private static Task<HubConnection> ConnectAsync(WebApplicationFactory<Program> factory, HttpClient client) =>
        ApiTestHost.ConnectAsync(factory, client);

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

        // 43 gebieden, om en om vanaf Alice: Alice krijgt er 22 (budget 40-22=18), Bob 21
        // (budget 40-21=19) — Claiming rondt dus vanzelf af naar InitialPlacement.
        Assert.Equal(GamePhaseDto.InitialPlacement, latest.Phase);
        Assert.Equal(aliceId, latest.SetupState?.ActivePlayerId);

        var aliceBudget = StartingArmies - latest.Territories.Count(t => t.OwnerPlayerId == aliceId);
        var bobBudget = StartingArmies - latest.Territories.Count(t => t.OwnerPlayerId == bobId);

        // Zelfde afwisseling als de server (SetupTurnCalculator): om de beurt plaatsen zolang
        // beiden nog budget hebben, daarna alleen wie er nog over heeft.
        while (aliceBudget > 0 || bobBudget > 0)
        {
            if (aliceBudget > 0)
            {
                latest = await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, aliceId, aliceTerritoryId!);
                aliceBudget--;
            }

            if (bobBudget > 0)
            {
                latest = await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, bobId, bobTerritoryId!);
                bobBudget--;
            }
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
        var aliceTerritoryCount = 0;
        var bobTerritoryCount = 0;

        for (var i = 0; i < territoryIds.Length; i++)
        {
            var claimerId = turnOrder[i % turnOrder.Length];
            await connection.InvokeAsync<GameStateDto>("ClaimTerritory", gameId, claimerId, territoryIds[i]);

            if (claimerId == aliceId)
            {
                aliceTerritoryId ??= territoryIds[i];
                aliceTerritoryCount++;
            }
            else
            {
                bobTerritoryId ??= territoryIds[i];
                bobTerritoryCount++;
            }
        }

        // Alice heeft budget 18 (40 - 22 gebieden); na 18 plaatsingen (afgewisseld met Bob,
        // die nog budget over heeft) is zij klaar en wordt haar volgende poging geweigerd.
        var aliceBudget = StartingArmies - aliceTerritoryCount;
        var bobBudget = StartingArmies - bobTerritoryCount;

        while (aliceBudget > 0)
        {
            await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, aliceId, aliceTerritoryId!);
            aliceBudget--;

            if (bobBudget > 0)
            {
                await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, bobId, bobTerritoryId!);
                bobBudget--;
            }
        }

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, aliceId, aliceTerritoryId!));

        Assert.Contains("setup.notYourTurnToPlace", exception.Message);
    }

    private static readonly GameSettingsDto RandomSetupSettings = new(
        WinConditionDto.WorldDomination,
        SetupModeDto.Random,
        StartingArmiesPresetId: "classic",
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
        ApiTestHost.Create(
            postgres,
            services => services.AddSingleton<IRandomSource>(
                new PrefixThenRandomSource(new SystemRandomSource(), 0, 1, 6, 4, 3, 2)));

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
        Assert.Equal(alice.PlayerId, state.SetupState?.ActivePlayerId);
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
    /// FO §5.1 (gecorrigeerd): bijplaatsen is ook bij Random turn-based — een speler die niet
    /// vooraan in <see cref="GameStateDto.TurnOrder"/> staat (Bob, want Alice wint de
    /// order-roll altijd in <see cref="CreateRandomModeFactory"/>) mag dus niet vóór Alice
    /// plaatsen, net als bij Claimen.
    /// </summary>
    [Fact]
    public async Task PlaceInitialArmy_BijRandom_SpelerNietVoorinBeurtvolgorde_WordtGeweigerd()
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
        Assert.Equal(alice.PlayerId, state.SetupState?.ActivePlayerId);

        var bobTerritoryId = state.Territories.First(territory => territory.OwnerPlayerId == bob.PlayerId).TerritoryId;

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, bob.PlayerId, bobTerritoryId));

        Assert.Contains("setup.notYourTurnToPlace", exception.Message);
    }

    /// <summary>
    /// FO §5.1 (gecorrigeerd): bij Random blijft de beurt afgedwongen totdat een speler zijn
    /// budget op heeft — daarna schuift de beurt door naar de ander, met dezelfde foutcode als
    /// bij Claimen (<c>setup.notYourTurnToPlace</c>, niet een apart "geen budget"-pad).
    /// </summary>
    [Fact]
    public async Task PlaceInitialArmy_BijRandom_BlijftBeurtAfgedwongenTotBudgetOp()
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
        var bobTerritoryId = state.Territories.First(t => t.OwnerPlayerId == bob.PlayerId).TerritoryId;
        var aliceBudget = StartingArmies - state.Territories.Count(t => t.OwnerPlayerId == alice.PlayerId);
        var bobBudget = StartingArmies - state.Territories.Count(t => t.OwnerPlayerId == bob.PlayerId);

        GameStateDto latest = state;

        while (aliceBudget > 0 || bobBudget > 0)
        {
            if (aliceBudget > 0)
            {
                latest = await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, alice.PlayerId, aliceTerritoryId);
                aliceBudget--;
            }

            if (bobBudget > 0)
            {
                latest = await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, bob.PlayerId, bobTerritoryId);
                bobBudget--;
            }
        }

        Assert.Equal(GamePhaseDto.InProgress, latest.Phase);
    }

    /// <summary>
    /// De eerste beurt is van de eerste speler in de beurtvolgorde, en zíjn versterkingen
    /// horen op het <c>PhaseChanged</c>-event te staan — niet die van wie toevallig het
    /// laatste startleger plaatste (die twee vallen bij turn-based bijplaatsen meestal samen,
    /// maar hoeven dat niet: hier plaatst p2, niet p1, het laatste leger). De twee spelers
    /// krijgen hier bewust een óngelijk gebiedsbezit (p1 heel Australië: 5 gebieden +
    /// continentbonus 3 = 6; p2 één gebied: het minimum van 3), anders levert de verkeerde
    /// speler dezelfde uitkomst op en blijft de test groen op een bug.
    /// </summary>
    [Fact]
    public async Task LaatsteStartleger_ZetDeVersterkingenVanDeEersteSpelerInDeVolgorde()
    {
        // Classic-preset, 2 spelers: 40 startlegers (data/starting-armies-presets.json).
        const int startingArmies = 40;

        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");

        var settings = new GameSettings(
            WinCondition.WorldDomination,
            SetupMode.Random,
            StartingArmiesPresetId: "classic",
            TurnTimer: TimeSpan.FromMinutes(3),
            FortifyTimer: TimeSpan.FromMinutes(1),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        // p1 heeft zijn 40 legers al geplaatst (36+1+1+1+1), p2 heeft er nog één over.
        var australia = new Dictionary<string, int>
        {
            ["indonesia"] = 36,
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
