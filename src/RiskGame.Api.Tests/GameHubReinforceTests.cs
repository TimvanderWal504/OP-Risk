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
/// Bewijst de TO §4-pijplijn voor <c>PlaceReinforcements</c> en <c>TradeInCards</c>
/// (FO §5.2) end-to-end, zelfde opzet als <see cref="GameHubSetupTests"/>. Kaarten komen er
/// nog niet via een hub-commando (<c>CardDrawn</c> hoort bij de aanvalsplak), dus deze tests
/// injecteren ze rechtstreeks in de event-stream.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubReinforceTests(PostgresFixture postgres)
{
    private static readonly GameSettingsDto Settings = new(
        WinConditionDto.SecretMissions,
        SetupModeDto.Claiming,
        StartingArmiesPresetId: "classic",
        TurnTimerSeconds: 180,
        FortifyTimerSeconds: 60,
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentModeDto.Random,
        EventsEnabled: false);

    // Zelfde volgorde als GameHubSetupTests: 2 trekkingen voor SecretMissions, dan wint Alice de
    // order-roll altijd meteen, zodat TurnOrder vaststaat.
    private WebApplicationFactory<Program> CreateFactory() =>
        ApiTestHost.Create(
            postgres,
            services => services.AddSingleton<IRandomSource>(new SequenceRandomSource(0, 1, 6, 4, 3, 2)));

    private static Task<HubConnection> ConnectAsync(WebApplicationFactory<Program> factory, HttpClient client) =>
        ApiTestHost.ConnectAsync(factory, client);

    private static async Task<string> CreateGameAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/games", new CreateGameRequest("standaard-43", Settings));
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<CreateGameResponse>();

        return body!.GameId;
    }

    /// <summary>
    /// Zet een spel volledig op tot en met InitialPlacement (43 gebieden om en om vanaf
    /// Alice, daarna de resterende legerbudgetten bijplaatsen) zodat de beurt bij Alice in
    /// <c>Reinforce</c> terechtkomt — zelfde rekenwerk als
    /// <see cref="GameHubSetupTests.VolledigeStartopstelling_EindigtInProgress"/>.
    /// </summary>
    private static async Task<(string GameId, string AliceId, string BobId, string AliceTerritoryId, string BobTerritoryId, GameStateDto State)>
        SetUpToReinforceAsync(HubConnection connection, HttpClient client)
    {
        var gameId = await CreateGameAsync(client);

        var alice = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, alice.PlayerId, "red");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, bob.PlayerId, "blue");
        await connection.InvokeAsync<GameStateDto>("StartGame", gameId, alice.PlayerId);

        await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, alice.PlayerId);
        var bobRoll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bob.PlayerId);

        var territoryIds = bobRoll.State.Territories.Select(territory => territory.TerritoryId).ToArray();
        var turnOrder = new[] { alice.PlayerId, bob.PlayerId };

        string? aliceTerritoryId = null;
        string? bobTerritoryId = null;
        GameStateDto latest = bobRoll.State;

        for (var i = 0; i < territoryIds.Length; i++)
        {
            var claimerId = turnOrder[i % turnOrder.Length];
            latest = await connection.InvokeAsync<GameStateDto>("ClaimTerritory", gameId, claimerId, territoryIds[i]);

            if (claimerId == alice.PlayerId)
            {
                aliceTerritoryId ??= territoryIds[i];
            }
            else
            {
                bobTerritoryId ??= territoryIds[i];
            }
        }

        // Classic-preset, 2 spelers (data/starting-armies-presets.json): 40 startlegers.
        // 43 gebieden, om en om vanaf Alice: Alice krijgt er 22 (budget 40-22=18), Bob 21
        // (budget 40-21=19) — zelfde afwisseling als SetupTurnCalculator (en GameHubSetupTests).
        const int startingArmies = 40;
        var aliceBudget = startingArmies - latest.Territories.Count(t => t.OwnerPlayerId == alice.PlayerId);
        var bobBudget = startingArmies - latest.Territories.Count(t => t.OwnerPlayerId == bob.PlayerId);

        while (aliceBudget > 0 || bobBudget > 0)
        {
            if (aliceBudget > 0)
            {
                latest = await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, alice.PlayerId, aliceTerritoryId!);
                aliceBudget--;
            }

            if (bobBudget > 0)
            {
                latest = await connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", gameId, bob.PlayerId, bobTerritoryId!);
                bobBudget--;
            }
        }

        return (gameId, alice.PlayerId, bob.PlayerId, aliceTerritoryId!, bobTerritoryId!, latest);
    }

    [Fact]
    public async Task VolledigeStartopstelling_LandtInReinforceMetPoolVoorAlice()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (_, aliceId, _, _, _, state) = await SetUpToReinforceAsync(connection, client);

        Assert.Equal(GamePhaseDto.InProgress, state.Phase);
        Assert.NotNull(state.TurnState);
        Assert.Equal(aliceId, state.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhaseDto.Reinforce, state.TurnState.TurnPhase);
        // Alice bezit 22 gebieden: max(3, 22/3) = max(3, 7) = 7, geen continent compleet.
        Assert.Equal(7, state.TurnState.ArmiesRemaining);
    }

    /// <summary>
    /// Doorloopt een volledige beurtcyclus (Reinforce → Attack → Fortify → volgende speler →
    /// Reinforce) end-to-end vanaf de echte InitialPlacement-uitkomst, om te bewijzen dat de
    /// cyclus daadwerkelijk teruglust en dat <c>ArmiesRemaining</c> bij terugkomst opnieuw
    /// klopt — niet alleen de eenmalige binnenkomst uit
    /// <see cref="VolledigeStartopstelling_LandtInReinforceMetPoolVoorAlice"/>. Events staan in
    /// <see cref="Settings"/> uit, dus dit bewijst niet of/wat er na een volledige rónde (alle
    /// spelers een beurt gehad, FO §9.2) gebeurt — dat is gebeurtenisronde-werk voor een latere
    /// taak (zie het Reinforce-plan, feit 5: het TV-dispatchmodel hoeft daar niet op te wachten).
    /// </summary>
    [Fact]
    public async Task VolledigeBeurtcyclus_KomtTerugBijReinforceMetOpnieuwCorrectePool()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (gameId, aliceId, bobId, aliceTerritoryId, bobTerritoryId, state) =
            await SetUpToReinforceAsync(connection, client);

        // Alice: plaats de volledige pool (7, zie VolledigeStartopstelling_...) en loop de
        // beurt af.
        var afterPlacing = await connection.InvokeAsync<GameStateDto>(
            "PlaceReinforcements", gameId, aliceId, aliceTerritoryId, state.TurnState!.ArmiesRemaining);
        Assert.Equal(0, afterPlacing.TurnState!.ArmiesRemaining);

        var afterAliceToAttack = await connection.InvokeAsync<GameStateDto>("EndPhase", gameId, aliceId);
        Assert.Equal(TurnPhaseDto.Attack, afterAliceToAttack.TurnState!.TurnPhase);

        var afterAliceToFortify = await connection.InvokeAsync<GameStateDto>("EndPhase", gameId, aliceId);
        Assert.Equal(TurnPhaseDto.Fortify, afterAliceToFortify.TurnState!.TurnPhase);

        var afterAliceTurn = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, aliceId);
        Assert.Equal(bobId, afterAliceTurn.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhaseDto.Reinforce, afterAliceTurn.TurnState.TurnPhase);
        // Bob bezit 21 gebieden: max(3, 21/3) = 7, geen continent compleet — zelfde rekenregel
        // als voor Alice.
        Assert.Equal(7, afterAliceTurn.TurnState.ArmiesRemaining);

        // Bob: zelfde cyclus, terug naar Alice.
        var afterBobPlacing = await connection.InvokeAsync<GameStateDto>(
            "PlaceReinforcements", gameId, bobId, bobTerritoryId, afterAliceTurn.TurnState.ArmiesRemaining);
        Assert.Equal(0, afterBobPlacing.TurnState!.ArmiesRemaining);

        await connection.InvokeAsync<GameStateDto>("EndPhase", gameId, bobId);
        await connection.InvokeAsync<GameStateDto>("EndPhase", gameId, bobId);
        var backToAlice = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, bobId);

        Assert.Equal(aliceId, backToAlice.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhaseDto.Reinforce, backToAlice.TurnState.TurnPhase);
        Assert.Equal(7, backToAlice.TurnState.ArmiesRemaining);
        Assert.NotNull(backToAlice.TurnState.Timer);
        Assert.False(backToAlice.TurnState.Timer!.IsPaused);
    }

    /// <summary>
    /// Rejoin-tijdens-Reinforce (Reinforce-plan, verificatiepunt "rejoin midden in
    /// Reinforce"): een speler die alvast een deel van de pool geplaatst heeft en dan
    /// opnieuw verbindt (nieuwe SignalR-connectie, zelfde scenario als een paginaherlaad)
    /// moet het restbudget en de breakdown terugkrijgen zoals de server ze nu kent — geen
    /// client-side staging die "doorleeft" over een reconnect heen.
    /// </summary>
    [Fact]
    public async Task RejoinTijdensReinforce_LevertActueelRestbudgetEnBreakdownOp()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (gameId, aliceId, _, aliceTerritoryId, _, state) = await SetUpToReinforceAsync(connection, client);

        // Alice plaatst 3 van haar 7 legers, dan valt de verbinding weg (nieuwe tab/refresh).
        await connection.InvokeAsync<GameStateDto>("PlaceReinforcements", gameId, aliceId, aliceTerritoryId, 3);

        await using var reconnected = await ConnectAsync(factory, client);
        var rejoined = await reconnected.InvokeAsync<GameStateDto>("RejoinGame", gameId, aliceId);

        Assert.Equal(GamePhaseDto.InProgress, rejoined.Phase);
        Assert.Equal(TurnPhaseDto.Reinforce, rejoined.TurnState!.TurnPhase);
        Assert.Equal(state.TurnState!.ArmiesRemaining - 3, rejoined.TurnState.ArmiesRemaining);
        Assert.NotNull(rejoined.TurnState.ReinforcementBreakdown);
        Assert.Equal(7, rejoined.TurnState.ReinforcementBreakdown!.BaseArmies);
    }

    [Fact]
    public async Task PlaceReinforcements_BinnenBudget_TeltLegersOpEnVerlaagtPool()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (gameId, aliceId, _, aliceTerritoryId, _, state) = await SetUpToReinforceAsync(connection, client);
        var armyCountBefore = state.Territories.Single(t => t.TerritoryId == aliceTerritoryId).ArmyCount;

        var updated = await connection.InvokeAsync<GameStateDto>(
            "PlaceReinforcements", gameId, aliceId, aliceTerritoryId, 3);

        Assert.Equal(armyCountBefore + 3, updated.Territories.Single(t => t.TerritoryId == aliceTerritoryId).ArmyCount);
        Assert.Equal(4, updated.TurnState!.ArmiesRemaining);
    }

    [Fact]
    public async Task PlaceReinforcements_BovenBudget_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (gameId, aliceId, _, aliceTerritoryId, _, _) = await SetUpToReinforceAsync(connection, client);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("PlaceReinforcements", gameId, aliceId, aliceTerritoryId, 8));

        Assert.Contains("reinforce.notEnoughArmiesRemaining", exception.Message);
    }

    [Fact]
    public async Task PlaceReinforcements_NietEigenGebied_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var (gameId, aliceId, _, _, bobTerritoryId, _) = await SetUpToReinforceAsync(connection, client);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("PlaceReinforcements", gameId, aliceId, bobTerritoryId, 1));

        Assert.Contains("common.territoryNotOwned", exception.Message);
    }

    /// <summary>Haalt drie kaarten met hetzelfde symbool op uit het deck (three-of-a-kind).</summary>
    private static Card[] ThreeOfAKindFrom(IReadOnlyList<Card> deck) =>
        deck
            .Where(card => !card.IsJoker)
            .GroupBy(card => card.Symbol)
            .First(group => group.Count() >= 3)
            .Take(3)
            .ToArray();

    /// <summary>
    /// Bouwt een spel rechtstreeks op in de projectie-fase Reinforce, met de opgegeven
    /// handkaarten al bij de speler — <see cref="CardDrawn"/> vereist een gevulde
    /// <see cref="DeckState.DrawPile"/>, die pas bij de aanvalsplak aangesloten wordt
    /// (TO §5.2), dus deze tests bouwen de startsituatie rechtstreeks, net als
    /// <c>GameProjectionRoundTripTests.CardsTraded_Vouwt...</c> dat op vouwregel-niveau doet.
    /// </summary>
    private static async Task<string> SetUpDirectReinforceStateAsync(
        WebApplicationFactory<Program> factory, IReadOnlyList<Card> hand, int armiesRemaining)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            Settings.StartingArmiesPresetId,
            TurnTimer: TimeSpan.FromSeconds(Settings.TurnTimerSeconds),
            FortifyTimer: TimeSpan.FromSeconds(Settings.FortifyTimerSeconds),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        var player = new Player(
            "p1", "Alice", "red", Hand: hand,
            RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false);

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(
                territory.Id,
                OwnerPlayerId: territory.Id == "alaska" ? "p1" : null,
                ArmyCount: territory.Id == "alaska" ? 1 : 0))
            .ToArray();

        var state = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            settings,
            players: [player],
            territories,
            turnOrder: ["p1"],
            turnState: new TurnState(
                "p1", TurnPhase.Reinforce, new PhaseTimer(settings.TurnTimer, DateTimeOffset.UtcNow), PendingCombat: null,
                ArmiesRemaining: armiesRemaining),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();

        await using var session = store.LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    [Fact]
    public async Task TradeInCards_GeldigeSet_LevertVrijePoolOpDieDirectPlaatsbaarIs()
    {
        await using var factory = CreateFactory();
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var cards = ThreeOfAKindFrom(mapSource.Load("standaard-43").Deck);

        var gameId = await SetUpDirectReinforceStateAsync(factory, cards, armiesRemaining: 3);

        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var afterTrade = await connection.InvokeAsync<GameStateDto>(
            "TradeInCards", gameId, "p1", cards.Select(card => card.Id).ToArray());

        // Eerste inleg levert altijd 4 op (FO §4.4), ongeacht eventuele bezitsbonussen.
        Assert.Equal(3 + 4, afterTrade.TurnState!.ArmiesRemaining);

        var afterPlace = await connection.InvokeAsync<GameStateDto>(
            "PlaceReinforcements", gameId, "p1", "alaska", afterTrade.TurnState.ArmiesRemaining);

        Assert.Equal(0, afterPlace.TurnState!.ArmiesRemaining);
    }

    [Fact]
    public async Task TradeInCards_OngeldigeSet_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var deck = mapSource.Load("standaard-43").Deck;
        var symbolGroups = deck.Where(card => !card.IsJoker).GroupBy(card => card.Symbol).ToList();

        // Twee kaarten van hetzelfde symbool + één van een ander: geen drie gelijke, geen
        // drie verschillende — een ongeldige set.
        var invalidSet = symbolGroups[0].Take(2)
            .Concat(symbolGroups.First(group => group.Key != symbolGroups[0].Key).Take(1))
            .ToArray();

        var gameId = await SetUpDirectReinforceStateAsync(factory, invalidSet, armiesRemaining: 3);

        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>(
                "TradeInCards", gameId, "p1", invalidSet.Select(card => card.Id).ToArray()));

        Assert.Contains("reinforce.invalidCardSet", exception.Message);
    }
}
