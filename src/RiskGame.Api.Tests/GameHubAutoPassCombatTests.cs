using Marten;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// Automatisch verdedigen voor een verdediger op auto-pass (FO §5.3 stap 4, §11.2): de server
/// verdedigt in hetzelfde commando dat het gevecht bij de verdediger legt, met het maximum binnen de
/// gewone regels en zonder DefenseBoost, en stuurt dezelfde gevechtsberichten als bij een eigen keuze.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubAutoPassCombatTests(PostgresFixture postgres)
{
    private WebApplicationFactory<Program> CreateFactory(params int[] diceSequence) =>
        ApiTestHost.Create(
            postgres, services => services.AddSingleton<IRandomSource>(new SequenceRandomSource(diceSequence)));

    /// <summary>
    /// "alaska" (p1, aanvaller, in Aanvallen) tegen "alberta" (p2, op auto-pass). Met
    /// <paramref name="aliceRerolls"/> is Alice "generaal" (Reroll-rol, herkomstland "china").
    /// </summary>
    /// <param name="aliceOwnsRest">Alice bezit alle andere gebieden; Alberta is Bobs enige gebied.</param>
    private static async Task<string> SetUpAsync(
        WebApplicationFactory<Program> factory, int aliceArmies, int bobArmies, bool aliceRerolls = false,
        bool aliceOwnsRest = false)
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
            RolesEnabled: aliceRerolls,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        var alice = new Player(
            "p1", "Alice", "red", Hand: [], RoleId: aliceRerolls ? "generaal" : null, Mission: null, IsEliminated: false);
        var bob = new Player("p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: true);

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "alaska" => new TerritoryOwnership(territory.Id, "p1", aliceArmies),
                "alberta" => new TerritoryOwnership(territory.Id, "p2", bobArmies),
                "china" when aliceRerolls => new TerritoryOwnership(territory.Id, "p1", 1),
                _ when aliceOwnsRest => new TerritoryOwnership(territory.Id, "p1", 1),
                "ontario" => new TerritoryOwnership(territory.Id, "p2", 1),
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
            turnState: new TurnState("p1", TurnPhase.Attack, new PhaseTimer(settings.TurnTimer, now), PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

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
    public async Task DeclareAttack_OpEenVerdedigerOpAutoPass_VerdedigtMetHetMaximumInDezelfdeActie()
    {
        // Aanval 2 en 3, verdediging 6 en 5: de aanvaller verliest er twee.
        await using var factory = CreateFactory(2, 3, 6, 5);
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);
        await using var spectator = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, aliceArmies: 5, bobArmies: 3);
        await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);

        var defenseRolled = new TaskCompletionSource<DiceRolledMessage>();
        var narrated = new TaskCompletionSource<CombatNarratedMessage>();
        spectator.On<DiceRolledMessage>("DiceRolled", message =>
        {
            if (message.Context == "defense") defenseRolled.TrySetResult(message);
        });
        spectator.On<CombatNarratedMessage>("CombatNarrated", message => narrated.TrySetResult(message));

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2);

        Assert.Equal([6, 5], (await defenseRolled.Task.WaitAsync(TimeSpan.FromSeconds(5))).Dice);
        var combat = await narrated.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal("p2", combat.DefenderId);
        Assert.Equal(2, combat.AttackerLosses);

        var state = await LoadAsync(factory, gameId);
        Assert.Null(state.TurnState!.PendingCombat);
        Assert.Equal(3, state.Territory("alaska").ArmyCount);
        Assert.Equal(3, state.Territory("alberta").ArmyCount);
    }

    /// <summary>FO §5.3 stap 4 (Huisregel): tegen 1 aanvalssteen verdedigt de server met 1.</summary>
    [Fact]
    public async Task DeclareAttack_HuisregelTegenEenAanvalssteen_VerdedigtMetEen()
    {
        // Aanval 6, verdediging 5: de verdediger verliest er één.
        await using var factory = CreateFactory(6, 5);
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, aliceArmies: 5, bobArmies: 3);

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 1);

        var state = await LoadAsync(factory, gameId);
        Assert.Null(state.TurnState!.PendingCombat);
        Assert.Equal(2, state.Territory("alberta").ArmyCount);
    }

    /// <summary>FO §5.3 stap 3: de verdediging wacht tot de aanvaller zijn herwerp-keuze heeft afgerond.</summary>
    [Fact]
    public async Task DeclareAttack_MetOpenHerwerpKeuze_VerdedigtPasNaDoorgaan()
    {
        await using var factory = CreateFactory(2, 3, 6, 5);
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, aliceArmies: 5, bobArmies: 3, aliceRerolls: true);

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2);

        Assert.True((await LoadAsync(factory, gameId)).TurnState!.PendingCombat!.AwaitingRerollDecision);

        await connection.InvokeAsync<GameStateDto>("KeepAttackDice", gameId, "p1");

        var state = await LoadAsync(factory, gameId);
        Assert.Null(state.TurnState!.PendingCombat);
        Assert.Equal(3, state.Territory("alaska").ArmyCount);
    }

    [Fact]
    public async Task DeclareAttack_AutomatischeVerdedigingVerliestHetGebied_WordtVeroverd()
    {
        // Aanval 6, verdediging 1: Alberta (1 leger) valt.
        await using var factory = CreateFactory(6, 1);
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, aliceArmies: 5, bobArmies: 1);

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 1);

        var state = await LoadAsync(factory, gameId);
        Assert.Equal("p1", state.Territory("alberta").OwnerPlayerId);
        // Bij een verovering blijft het gevecht staan tot de meeverplaatsing (FO §5.3 stap 6).
        Assert.NotNull(state.TurnState!.PendingCombat);
    }

    /// <summary>
    /// FO §6/§7: schakelt de automatische verdediging de laatste tegenstander uit, dan wint de
    /// aanvaller meteen — ook als dat in <c>DeclareAttack</c> gebeurt in plaats van in
    /// <c>ChooseDefenseDice</c>, met dezelfde <c>GameWon</c>-broadcast.
    /// </summary>
    [Fact]
    public async Task DeclareAttack_AutomatischeVerdedigingVerliestHetLaatsteGebied_WintDeAanvaller()
    {
        await using var factory = CreateFactory(6, 1);
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);
        await using var spectator = await ApiTestHost.ConnectAsync(factory, client);

        var gameId = await SetUpAsync(factory, aliceArmies: 5, bobArmies: 1, aliceOwnsRest: true);
        await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);

        var gameWon = new TaskCompletionSource<GameWonMessage>();
        spectator.On<GameWonMessage>("GameWon", message => gameWon.TrySetResult(message));

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 1);

        Assert.Equal(["p1"], (await gameWon.Task.WaitAsync(TimeSpan.FromSeconds(5))).WinnerPlayerIds);

        var state = await LoadAsync(factory, gameId);
        Assert.Equal(GamePhase.Finished, state.Phase);
        Assert.True(state.Player("p2").IsEliminated);
    }
}
