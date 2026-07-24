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
/// Bewijst de TO §4-pijplijn voor <c>DeclareAttack</c>, <c>ChooseDefenseDice</c> en
/// <c>MoveAfterConquest</c> (FO §5.3) end-to-end. Zelfde opzet als
/// <see cref="GameHubReinforceTests"/>: het spel wordt rechtstreeks in de gewenste
/// startsituatie opgebouwd in plaats van via <c>EndPhase</c>/<c>EndTurn</c>
/// (<see cref="GameHubTurnFlowTests"/>), en de dobbelworpen liggen vooraf vast via
/// <see cref="SequenceRandomSource"/> zodat de uitkomst reproduceerbaar is.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubAttackTests(PostgresFixture postgres)
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

    private WebApplicationFactory<Program> CreateFactory(params int[] diceSequence) =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Postgres"] = postgres.ConnectionString,
                }));

            builder.ConfigureServices(services =>
                services.AddSingleton<IRandomSource>(new SequenceRandomSource(diceSequence)));
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
    /// Bouwt een spel rechtstreeks op in de projectie-fase Attack, met "alaska" (p1) grenzend
    /// aan "alberta" (p2) — zelfde adjacency-paar als <c>AttackGuardsTests</c>. Optioneel een
    /// extra gebied voor p2 (<paramref name="extraBobTerritoryId"/>) om te bewijzen dat
    /// verovering van niet-het-laatste-gebied geen <c>PlayerEliminated</c> oplevert.
    /// </summary>
    private static async Task<string> SetUpAttackStateAsync(
        WebApplicationFactory<Program> factory,
        int aliceArmies,
        int bobArmies,
        string? extraBobTerritoryId = null)
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
                "alaska" => new TerritoryOwnership(territory.Id, "p1", aliceArmies),
                "alberta" => new TerritoryOwnership(territory.Id, "p2", bobArmies),
                _ when territory.Id == extraBobTerritoryId => new TerritoryOwnership(territory.Id, "p2", 1),
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
                "p1", TurnPhase.Attack, new PhaseTimer(settings.TurnTimer), PendingCombat: null),
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
    public async Task DeclareAttack_ZonderVerovering_TeltVerliezenAfEnLeegtGevecht()
    {
        // Aanvaller (2 dobbelstenen): 3,2. Verdediger (2 dobbelstenen): 6,5 — verdediger
        // wint beide vergelijkingen, dus de aanvaller verliest 2 legers, niemand veroverd.
        await using var factory = CreateFactory(2, 3, 6, 5);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 5, bobArmies: 3);

        var declareResult = await connection.InvokeAsync<DeclareAttackResponse>(
            "DeclareAttack", gameId, "p1", "alaska", "alberta", 2);

        Assert.Equal([3, 2], declareResult.AttackerRolls);
        Assert.NotNull(declareResult.State.TurnState!.PendingCombat);

        var combatResult = await connection.InvokeAsync<CombatResultResponse>(
            "ChooseDefenseDice", gameId, "p2", 2);

        Assert.Equal([6, 5], combatResult.DefenderRolls);
        Assert.Equal(2, combatResult.AttackerLosses);
        Assert.Equal(0, combatResult.DefenderLosses);
        Assert.False(combatResult.Conquered);
        Assert.Null(combatResult.State.TurnState!.PendingCombat);

        Assert.Equal(3, combatResult.State.Territories.Single(t => t.TerritoryId == "alaska").ArmyCount);
        Assert.Equal(3, combatResult.State.Territories.Single(t => t.TerritoryId == "alberta").ArmyCount);
        Assert.Equal("p2", combatResult.State.Territories.Single(t => t.TerritoryId == "alberta").OwnerPlayerId);
    }

    [Fact]
    public async Task ChooseDefenseDice_MetVerovering_DraagtEigendomOverEnHoudtGevechtOpenTotMeeverplaatsing()
    {
        // Aanvaller (3 dobbelstenen): 6,5,1. Verdediger (2 dobbelstenen): 2,1 — de aanvaller
        // wint beide vergeleken paren, dus de verdediger verliest zijn 2 legers: veroverd.
        await using var factory = CreateFactory(6, 5, 1, 2, 1);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        // Bob heeft ook nog "alberta" als extra gebied, dus dit is niet zijn laatste.
        var gameId = await SetUpAttackStateAsync(
            factory, aliceArmies: 4, bobArmies: 2, extraBobTerritoryId: "ontario");

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 3);
        var combatResult = await connection.InvokeAsync<CombatResultResponse>(
            "ChooseDefenseDice", gameId, "p2", 2);

        Assert.Equal(0, combatResult.AttackerLosses);
        Assert.Equal(2, combatResult.DefenderLosses);
        Assert.True(combatResult.Conquered);

        var alberta = combatResult.State.Territories.Single(t => t.TerritoryId == "alberta");
        Assert.Equal("p1", alberta.OwnerPlayerId);
        Assert.Equal(0, alberta.ArmyCount);

        // Het gevecht blijft open tot MoveAfterConquest.
        Assert.NotNull(combatResult.State.TurnState!.PendingCombat);
        Assert.False(combatResult.State.Players.Single(p => p.Id == "p2").IsEliminated);

        var afterMove = await connection.InvokeAsync<GameStateDto>("MoveAfterConquest", gameId, "p1", 3);

        Assert.Null(afterMove.TurnState!.PendingCombat);
        Assert.Equal(1, afterMove.Territories.Single(t => t.TerritoryId == "alaska").ArmyCount);
        Assert.Equal(3, afterMove.Territories.Single(t => t.TerritoryId == "alberta").ArmyCount);
    }

    [Fact]
    public async Task ChooseDefenseDice_VeroveringVanLaatsteGebied_SchakeltSpelerUit()
    {
        // Zelfde worpen als de vorige test, maar Bob bezit nu alleen "alberta".
        await using var factory = CreateFactory(6, 5, 1, 2, 1);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 4, bobArmies: 2);

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 3);
        var combatResult = await connection.InvokeAsync<CombatResultResponse>(
            "ChooseDefenseDice", gameId, "p2", 2);

        Assert.True(combatResult.Conquered);

        var bob = combatResult.State.Players.Single(p => p.Id == "p2");
        Assert.True(bob.IsEliminated);
    }

    [Fact]
    public async Task DeclareAttack_MetTeWeinigLegers_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 1, bobArmies: 3);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 1));

        Assert.Contains("minimaal 2 legers", exception.Message);
    }

    [Fact]
    public async Task ChooseDefenseDice_DoorDeAanvaller_WordtGeweigerd()
    {
        await using var factory = CreateFactory(2, 3);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 5, bobArmies: 3);
        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p1", 2));

        Assert.Contains("niet de verdediger", exception.Message);
    }

    [Fact]
    public async Task ChooseDefenseDice_MetTweeDobbelstenenBijEenLeger_WordtGeweigerd()
    {
        await using var factory = CreateFactory(2, 3);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 5, bobArmies: 1);
        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2));

        Assert.Contains("alleen met 1 dobbelsteen", exception.Message);
    }
}
