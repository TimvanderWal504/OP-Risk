using Marten;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Map;
using RiskGame.Rules.Missions;
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
    private static readonly GameSettingsDto SettingsDto = new(
        WinConditionDto.SecretMissions,
        SetupModeDto.Claiming,
        StartingArmiesPresetId: "classic",
        TurnTimerSeconds: 180,
        FortifyTimerSeconds: 60,
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentModeDto.Random,
        EventsEnabled: false);

    private WebApplicationFactory<Program> CreateFactory(params int[] diceSequence) =>
        ApiTestHost.Create(
            postgres,
            services => services.AddSingleton<IRandomSource>(new SequenceRandomSource(diceSequence)));

    /// <summary>Zelfde als <see cref="CreateFactory(int[])"/>, met een besturbare klok voor de
    /// timer-continuatie-tests (FO §5.4) — zelfde patroon als <see cref="GameStateDtoMapperTimerTests"/>.</summary>
    private WebApplicationFactory<Program> CreateFactory(FakeTimeProvider timeProvider, params int[] diceSequence) =>
        ApiTestHost.Create(
            postgres,
            services =>
            {
                services.AddSingleton<IRandomSource>(new SequenceRandomSource(diceSequence));
                services.AddSingleton<TimeProvider>(timeProvider);
            });

    private static Task<HubConnection> ConnectAsync(WebApplicationFactory<Program> factory, HttpClient client) =>
        ApiTestHost.ConnectAsync(factory, client);

    /// <summary>
    /// Bouwt een spel rechtstreeks op in de projectie-fase Attack, met "alaska" (p1) grenzend
    /// aan "alberta" (p2) — zelfde adjacency-paar als <c>AttackGuardsTests</c>. Optioneel een
    /// extra gebied voor p2 (<paramref name="extraBobTerritoryId"/>) om te bewijzen dat
    /// verovering van niet-het-laatste-gebied geen <c>PlayerEliminated</c> oplevert, of juist
    /// de rest van de kaart voor Alice (<paramref name="aliceOwnsRestOfMap"/>) om een
    /// werelddominantie-scenario te kunnen zetten — <c>WinConditionEvaluator.HasWorldDomination</c>
    /// controleert alle 43 gebieden, niet alleen het aanvals-/verdedigingspaar.
    /// </summary>
    private static async Task<string> SetUpAttackStateAsync(
        WebApplicationFactory<Program> factory,
        int aliceArmies,
        int bobArmies,
        string? extraBobTerritoryId = null,
        bool aliceOwnsRestOfMap = false,
        IReadOnlyList<Card>? aliceHand = null,
        int armiesRemaining = 0)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");
        // Niet `DateTimeOffset.UtcNow`: bij een `FakeTimeProvider`-factory (de
        // timer-continuatie-tests) zou de échte klok tijdens de setup verder lopen dan de
        // bevroren fake-klok, zodat de eerste `DeclareAttack` een negatieve verstreken tijd
        // ziet en `PhaseTimer.Tick` gooit. Altijd de geïnjecteerde `TimeProvider` gebruiken,
        // zodat setup en command handler dezelfde klok delen.
        var timeProviderNow = factory.Services.GetRequiredService<TimeProvider>().GetUtcNow();

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            SettingsDto.StartingArmiesPresetId,
            TurnTimer: TimeSpan.FromSeconds(SettingsDto.TurnTimerSeconds),
            FortifyTimer: TimeSpan.FromSeconds(SettingsDto.FortifyTimerSeconds),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        var alice = new Player(
            "p1", "Alice", "red", Hand: aliceHand ?? [], RoleId: null, Mission: null, IsEliminated: false);
        var bob = new Player(
            "p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false);

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "alaska" => new TerritoryOwnership(territory.Id, "p1", aliceArmies),
                "alberta" => new TerritoryOwnership(territory.Id, "p2", bobArmies),
                _ when territory.Id == extraBobTerritoryId => new TerritoryOwnership(territory.Id, "p2", 1),
                _ when aliceOwnsRestOfMap => new TerritoryOwnership(territory.Id, "p1", 1),
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
                "p1", TurnPhase.Attack, new PhaseTimer(settings.TurnTimer, timeProviderNow), PendingCombat: null,
                ArmiesRemaining: armiesRemaining),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();

        await using var session = store.LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    /// <summary>
    /// Zelfde "alaska" (p1) tegen "alberta" (p2) opstelling als <see cref="SetUpAttackStateAsync"/>,
    /// maar met rollen aan en Alice als "generaal" (Reroll-effect, herkomstland "china") —
    /// nodig voor de plan-rollen taak 4 hub-tests (reroll/doorgaan) hieronder.
    /// </summary>
    private static async Task<string> SetUpAttackStateWithRerollRoleAsync(
        WebApplicationFactory<Program> factory, int aliceArmies, int bobArmies)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");
        var timeProviderNow = factory.Services.GetRequiredService<TimeProvider>().GetUtcNow();

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            SettingsDto.StartingArmiesPresetId,
            TurnTimer: TimeSpan.FromSeconds(SettingsDto.TurnTimerSeconds),
            FortifyTimer: TimeSpan.FromSeconds(SettingsDto.FortifyTimerSeconds),
            RolesEnabled: true,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        var alice = new Player("p1", "Alice", "red", Hand: [], RoleId: "generaal", Mission: null, IsEliminated: false);
        var bob = new Player("p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false);

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "china" => new TerritoryOwnership(territory.Id, "p1", ArmyCount: 1),
                "alaska" => new TerritoryOwnership(territory.Id, "p1", aliceArmies),
                "alberta" => new TerritoryOwnership(territory.Id, "p2", bobArmies),
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
                "p1", TurnPhase.Attack, new PhaseTimer(settings.TurnTimer, timeProviderNow), PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();

        await using var session = store.LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    /// <summary>
    /// "alaska" (p1, 5 legers) tegen "alberta" (p2, 3 legers), rollen aan, Bob als "capoeirista"
    /// (DefenseBoost, herkomstland "brazil") — FO §5.3 stap 4 / §8.1.
    /// </summary>
    private static async Task<string> SetUpDefenseBoostStateAsync(
        WebApplicationFactory<Program> factory, DefenseDiceRule rule, bool bobOwnsBrazil = true)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var map = factory.Services.GetRequiredService<IMapDefinitionSource>().Load("standaard-43");
        var timeProviderNow = factory.Services.GetRequiredService<TimeProvider>().GetUtcNow();

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            SettingsDto.StartingArmiesPresetId,
            TurnTimer: TimeSpan.FromSeconds(SettingsDto.TurnTimerSeconds),
            FortifyTimer: TimeSpan.FromSeconds(SettingsDto.FortifyTimerSeconds),
            RolesEnabled: true,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false,
            DefenseDiceRule: rule);

        var alice = new Player("p1", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false);
        var bob = new Player("p2", "Bob", "blue", Hand: [], RoleId: "capoeirista", Mission: null, IsEliminated: false);

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "brazil" when bobOwnsBrazil => new TerritoryOwnership(territory.Id, "p2", ArmyCount: 1),
                "alaska" => new TerritoryOwnership(territory.Id, "p1", 5),
                "alberta" => new TerritoryOwnership(territory.Id, "p2", 3),
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
                "p1", TurnPhase.Attack, new PhaseTimer(settings.TurnTimer, timeProviderNow), PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();

        await using var session = store.LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    [Fact]
    public async Task ChooseDefenseDice_HuisregelTegenEenAanvalsdobbelsteenMetTweeZonderBoost_WordtGeweigerd()
    {
        await using var factory = CreateFactory(3, 5, 4);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpDefenseBoostStateAsync(factory, DefenseDiceRule.HouseRule, bobOwnsBrazil: false);
        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 1);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2, true));

        Assert.Contains("attack.mustDefendWithOneDieHouseRule", exception.Message);
    }

    [Fact]
    public async Task ChooseDefenseDice_MetIngezetteBoost_VerbruiktDeBoostEnBroadcastDefenseBoost()
    {
        await using var factory = CreateFactory(3, 5, 4);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);
        await using var spectator = await ConnectAsync(factory, client);

        var gameId = await SetUpDefenseBoostStateAsync(factory, DefenseDiceRule.HouseRule);
        await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);

        var defenseRollReceived = new TaskCompletionSource<DiceRolledMessage>();
        spectator.On<DiceRolledMessage>("DiceRolled", message =>
        {
            if (message.Context is "defense" or "defenseBoost")
            {
                defenseRollReceived.TrySetResult(message);
            }
        });

        var declared = await connection.InvokeAsync<DeclareAttackResponse>(
            "DeclareAttack", gameId, "p1", "alaska", "alberta", 1);
        Assert.True(declared.State.Players.Single(player => player.Id == "p2").DefenseBoostAvailable);

        var combat = await connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2, true);

        Assert.Equal(2, combat.DefenderRolls.Count);
        Assert.False(combat.State.Players.Single(player => player.Id == "p2").DefenseBoostAvailable);

        var defenseRoll = await defenseRollReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal("defenseBoost", defenseRoll.Context);
    }

    [Fact]
    public async Task ChooseDefenseDice_MetAlVerbruikteBoost_WordtGeweigerdBijEenTweedeAanval()
    {
        // Worp 1: aanval 3 tegen verdediging 5/4 (afgeslagen); worp 2: aanval 3.
        await using var factory = CreateFactory(3, 5, 4, 3);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpDefenseBoostStateAsync(factory, DefenseDiceRule.HouseRule);
        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 1);
        await connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2, true);
        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 1);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2, true));

        Assert.Contains("attack.mustDefendWithOneDieHouseRule", exception.Message);
    }

    [Fact]
    public async Task ChooseDefenseDice_KlassiekTegenEenAanvalsdobbelsteen_MetTweeZonderBoostIsToegestaan()
    {
        await using var factory = CreateFactory(3, 5, 4);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpDefenseBoostStateAsync(factory, DefenseDiceRule.Classic);
        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 1);

        var combat = await connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2, false);

        Assert.Equal(2, combat.DefenderRolls.Count);
        Assert.False(combat.State.Players.Single(player => player.Id == "p2").DefenseBoostAvailable);
    }

    [Fact]
    public async Task DeclareAttack_MetActieveRerollRol_OpentDeHerwerpBeslissing()
    {
        await using var factory = CreateFactory(4, 2);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateWithRerollRoleAsync(factory, aliceArmies: 5, bobArmies: 3);

        var declared = await connection.InvokeAsync<DeclareAttackResponse>(
            "DeclareAttack", gameId, "p1", "alaska", "alberta", 2);

        Assert.True(declared.State.TurnState!.PendingCombat!.AwaitingRerollDecision);
        Assert.Equal([4, 2], declared.State.TurnState.PendingCombat.AttackerRolls);
    }

    [Fact]
    public async Task ChooseDefenseDice_ZolangDeHerwerpBeslissingOpenStaat_WordtGeweigerd()
    {
        // Plan-rollen taak 4: de verdediger mag pas kiezen ná "Herwerp" of "Doorgaan".
        await using var factory = CreateFactory(4, 2);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateWithRerollRoleAsync(factory, aliceArmies: 5, bobArmies: 3);
        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2, false));

        Assert.Contains("attack.awaitingRerollDecision", exception.Message);
    }

    [Fact]
    public async Task RerollAttackDie_ZonderActieveRol_WordtGeweigerd()
    {
        // Zonder rollen aan staat er nooit een open herwerp-beslissing (AttackGuards.RerollAvailable).
        await using var factory = CreateFactory(2, 3);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 5, bobArmies: 3);
        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<RerollAttackDieResponse>("RerollAttackDie", gameId, "p1", 0));

        Assert.Contains("attack.noRerollDecisionOpen", exception.Message);
    }

    [Fact]
    public async Task RerollAttackDie_MetActieveRol_HerwerptDeGekozenSteenEnSluitDeBeslissing()
    {
        // Aanvalsworp [4, 2], daarna de herwerp van dieIndex 1 (waarde 2) naar 6, en tot slot een
        // verdedigingsworp [2, 1] om te bewijzen dat ChooseDefenseDice de herworpen waarde gebruikt.
        await using var factory = CreateFactory(4, 2, 6, 2, 1);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateWithRerollRoleAsync(factory, aliceArmies: 5, bobArmies: 3);
        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2);

        var rerolled = await connection.InvokeAsync<RerollAttackDieResponse>("RerollAttackDie", gameId, "p1", 1);

        Assert.Equal([4, 2], rerolled.PreviousRolls);
        Assert.Equal(1, rerolled.RerolledDieIndex);
        Assert.Equal(6, rerolled.NewValue);
        Assert.Equal([6, 4], rerolled.Rolls);
        Assert.False(rerolled.State.TurnState!.PendingCombat!.AwaitingRerollDecision);
        Assert.Equal([6, 4], rerolled.State.TurnState.PendingCombat.AttackerRolls);

        // Na de herwerp-beslissing mag de verdediger weer kiezen, en ChooseDefenseDice moet de
        // nieuwe worp gebruiken (C5/C6) — niet de oorspronkelijke [4, 2] uit de DiceRolled-audittrail.
        var combatResult = await connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2, false);
        Assert.Equal([6, 4], combatResult.AttackerRolls);
    }

    [Fact]
    public async Task RerollAttackDie_BroadcastDiceRolledMetContextReroll_MetDeJuisteVelden()
    {
        await using var factory = CreateFactory(4, 2, 6);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);
        await using var spectator = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateWithRerollRoleAsync(factory, aliceArmies: 5, bobArmies: 3);
        await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);

        var rerollReceived = new TaskCompletionSource<DiceRolledMessage>();
        spectator.On<DiceRolledMessage>("DiceRolled", message =>
        {
            if (message.Context == "reroll")
            {
                rerollReceived.TrySetResult(message);
            }
        });

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2);
        await connection.InvokeAsync<RerollAttackDieResponse>("RerollAttackDie", gameId, "p1", 1);

        var reroll = await rerollReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.Equal("p1", reroll.PlayerId);
        Assert.Equal([6, 4], reroll.Dice);
        Assert.Equal([4, 2], reroll.PreviousRolls);
        Assert.Equal(1, reroll.RerolledDieIndex);
        Assert.Equal(6, reroll.NewValue);
    }

    [Fact]
    public async Task KeepAttackDice_SluitDeBeslissingZonderTeHerwerpenEnVerbruiktHetHerwerpNiet()
    {
        // A8: "Doorgaan" verbruikt de herwerp voor dit doelgebied niet — een volgende worp tegen
        // hetzelfde doelgebied (na een afgeslagen aanval) biedt de beslissing opnieuw aan.
        await using var factory = CreateFactory(4, 2, 6, 1, 4, 2);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateWithRerollRoleAsync(factory, aliceArmies: 5, bobArmies: 5);
        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2);

        var kept = await connection.InvokeAsync<GameStateDto>("KeepAttackDice", gameId, "p1");

        Assert.False(kept.TurnState!.PendingCombat!.AwaitingRerollDecision);
        Assert.Equal([4, 2], kept.TurnState.PendingCombat.AttackerRolls);

        await connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2, false);

        var second = await connection.InvokeAsync<DeclareAttackResponse>(
            "DeclareAttack", gameId, "p1", "alaska", "alberta", 2);

        Assert.True(second.State.TurnState!.PendingCombat!.AwaitingRerollDecision);
    }

    [Fact]
    public async Task WatchGame_MetOpenHerwerpBeslissing_VultPendingCombatDto()
    {
        // Reconnect-herstel (plan-rollen taak 4): een client die pas ná DeclareAttack binnenkomt
        // (of opnieuw verbindt) moet de open beslissing alsnog kunnen afleiden uit de state.
        await using var factory = CreateFactory(4, 2);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateWithRerollRoleAsync(factory, aliceArmies: 5, bobArmies: 3);
        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2);

        await using var reconnecting = await ConnectAsync(factory, client);
        var watched = await reconnecting.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.True(watched.TurnState!.PendingCombat!.AwaitingRerollDecision);
        Assert.Equal([4, 2], watched.TurnState.PendingCombat.AttackerRolls);
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
        // FO §5.4: uitgevoerde aanvallen kosten de aanvaller geen beurttijd — de beurttimer
        // moet gepauzeerd zijn zolang het gevecht loopt.
        Assert.True(declareResult.State.TurnState!.Timer!.IsPaused);

        var combatResult = await connection.InvokeAsync<CombatResultResponse>(
            "ChooseDefenseDice", gameId, "p2", 2, false);

        Assert.Equal([6, 5], combatResult.DefenderRolls);
        Assert.Equal(2, combatResult.AttackerLosses);
        Assert.Equal(0, combatResult.DefenderLosses);
        Assert.False(combatResult.Conquered);
        Assert.Null(combatResult.State.TurnState!.PendingCombat);
        // Geen verovering, maar "een gevecht" is de hele belegering van dit doelwit, niet één
        // worp (FO §5.4, herzien 2026-08-04): de timer blijft gepauzeerd zolang de aanvaller
        // hetzelfde doelwit belegert. Zie DeclareAttack_HerhaaldeAanvalOpzelfdeDoelwit_HoudtTimerBevroren.
        Assert.True(combatResult.State.TurnState!.Timer!.IsPaused);

        Assert.Equal(3, combatResult.State.Territories.Single(t => t.TerritoryId == "alaska").ArmyCount);
        Assert.Equal(3, combatResult.State.Territories.Single(t => t.TerritoryId == "alberta").ArmyCount);
        Assert.Equal("p2", combatResult.State.Territories.Single(t => t.TerritoryId == "alberta").OwnerPlayerId);
    }

    [Fact]
    public async Task DeclareAttack_HerhaaldeAanvalOpZelfdeDoelwit_HoudtTimerBevroren()
    {
        // FO §5.4 (herzien 2026-08-04): "een gevecht" is de hele belegering van één doelwit,
        // niet één worp — de timer blijft bevroren over meerdere achtereenvolgende worpen op
        // hetzelfde gebiedspaar heen, ook al verstrijkt er tussendoor echte klok-tijd.
        var timeProvider = new FakeTimeProvider(DateTimeOffset.UtcNow);
        // 1 dobbelsteen per ronde, aanvaller verliest allebei (2 tegen 5 — gelijkspel/hoger
        // wint de verdediger), geen verovering in beide rondes.
        await using var factory = CreateFactory(timeProvider, 2, 5, 2, 5);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 5, bobArmies: 5);

        var first = await connection.InvokeAsync<DeclareAttackResponse>(
            "DeclareAttack", gameId, "p1", "alaska", "alberta", 1);
        Assert.True(first.State.TurnState!.Timer!.IsPaused);

        var afterFirstFight = await connection.InvokeAsync<CombatResultResponse>(
            "ChooseDefenseDice", gameId, "p2", 1, false);
        var remainingAfterFirstFight = afterFirstFight.State.TurnState!.Timer!.RemainingMs;
        Assert.True(afterFirstFight.State.TurnState!.Timer!.IsPaused);

        // 30 seconden "bedenktijd" tussen de twee worpen op hetzelfde doelwit — mag niet
        // meetellen, want de belegering van "alberta" loopt door.
        timeProvider.Advance(TimeSpan.FromSeconds(30));

        var second = await connection.InvokeAsync<DeclareAttackResponse>(
            "DeclareAttack", gameId, "p1", "alaska", "alberta", 1);

        Assert.True(second.State.TurnState!.Timer!.IsPaused);
        Assert.Equal(remainingAfterFirstFight, second.State.TurnState!.Timer!.RemainingMs);
    }

    [Fact]
    public async Task DeclareAttack_DrieOpeenvolgendeAanvallenOpZelfdeDoelwit_TimerBlijftBevrorenZonderDrift()
    {
        // Reproduceert de melding "na meerdere aanvallen loopt de timer weer op": niet twee maar
        // drie achtereenvolgende worpen op hetzelfde doelwit, met telkens echte klok-tijd ertussen
        // (zowel vóór als na elke ChooseDefenseDice) — bewijst dat elke herhaalde Pause()-aanroep
        // (AttackCommandHandler.DeclareAttackAsync L72-74, isSameTarget-tak) geen tijd laat lekken
        // over drie rondes heen, niet alleen over één herhaling.
        var timeProvider = new FakeTimeProvider(DateTimeOffset.UtcNow);
        await using var factory = CreateFactory(timeProvider, 2, 5, 2, 5, 2, 5);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 7, bobArmies: 8);

        var first = await connection.InvokeAsync<DeclareAttackResponse>(
            "DeclareAttack", gameId, "p1", "alaska", "alberta", 1);
        Assert.True(first.State.TurnState!.Timer!.IsPaused);
        var remainingAfterDeclare = first.State.TurnState!.Timer!.RemainingMs;

        timeProvider.Advance(TimeSpan.FromSeconds(10));

        for (var round = 0; round < 3; round++)
        {
            var afterFight = await connection.InvokeAsync<CombatResultResponse>(
                "ChooseDefenseDice", gameId, "p2", 1, false);
            Assert.True(afterFight.State.TurnState!.Timer!.IsPaused);
            Assert.Equal(remainingAfterDeclare, afterFight.State.TurnState!.Timer!.RemainingMs);

            timeProvider.Advance(TimeSpan.FromSeconds(15));

            if (round == 2)
            {
                break;
            }

            var again = await connection.InvokeAsync<DeclareAttackResponse>(
                "DeclareAttack", gameId, "p1", "alaska", "alberta", 1);
            Assert.True(again.State.TurnState!.Timer!.IsPaused);
            Assert.Equal(remainingAfterDeclare, again.State.TurnState!.Timer!.RemainingMs);

            timeProvider.Advance(TimeSpan.FromSeconds(10));
        }
    }

    [Fact]
    public async Task ChooseDefenseDice_AfgeslagenAanval_TimerBlijftBevrorenZonderVervolgcommando()
    {
        // Reproduceert het exacte scenario van de melding: de aanvaller blijft gewoon op het
        // resultaatscherm van een afgeslagen aanval zitten (geen "Nog een keer aanvallen"/"Ander
        // gevecht" geklikt) en ververst alleen de state (WatchGame, geen state-wijzigend
        // commando) nadat er echte klok-tijd verstreken is. FO §5.4 (herzien 2026-08-04): de
        // timer mag dan niet doortellen, ook niet stilzwijgend via een pure state-fetch.
        var timeProvider = new FakeTimeProvider(DateTimeOffset.UtcNow);
        await using var factory = CreateFactory(timeProvider, 2, 5);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 5, bobArmies: 5);

        await connection.InvokeAsync<DeclareAttackResponse>(
            "DeclareAttack", gameId, "p1", "alaska", "alberta", 1);
        var afterFight = await connection.InvokeAsync<CombatResultResponse>(
            "ChooseDefenseDice", gameId, "p2", 1, false);
        var remainingAfterFight = afterFight.State.TurnState!.Timer!.RemainingMs;
        Assert.True(afterFight.State.TurnState!.Timer!.IsPaused);

        timeProvider.Advance(TimeSpan.FromSeconds(45));

        var watched = await connection.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.True(watched.TurnState!.Timer!.IsPaused);
        Assert.Equal(remainingAfterFight, watched.TurnState!.Timer!.RemainingMs);
    }

    [Fact]
    public async Task DeclareAttack_AnderDoelwitNaAfgeslagenAanval_VerrekentTussenliggendeTijdEnPauzeertOpnieuw()
    {
        // FO §5.4 (herzien 2026-08-04): kiest de aanvaller ná een afgeslagen aanval een ánder
        // doelwit, dan is dat een nieuwe belegering — de tijd tussen de twee gevechten telt nu
        // wél mee, tot de nieuwe "Gooi" opnieuw pauzeert.
        var timeProvider = new FakeTimeProvider(DateTimeOffset.UtcNow);
        await using var factory = CreateFactory(timeProvider, 2, 5, 6);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(
            factory, aliceArmies: 5, bobArmies: 5, extraBobTerritoryId: "northwest-territory");

        await connection.InvokeAsync<DeclareAttackResponse>(
            "DeclareAttack", gameId, "p1", "alaska", "alberta", 1);
        var afterFirstFight = await connection.InvokeAsync<CombatResultResponse>(
            "ChooseDefenseDice", gameId, "p2", 1, false);
        var remainingAfterFirstFight = afterFirstFight.State.TurnState!.Timer!.RemainingMs;
        Assert.True(afterFirstFight.State.TurnState!.Timer!.IsPaused);

        timeProvider.Advance(TimeSpan.FromSeconds(20));

        var switched = await connection.InvokeAsync<DeclareAttackResponse>(
            "DeclareAttack", gameId, "p1", "alaska", "northwest-territory", 1);

        Assert.True(switched.State.TurnState!.Timer!.IsPaused);
        Assert.Equal(remainingAfterFirstFight - 20_000, switched.State.TurnState!.Timer!.RemainingMs, tolerance: 100);
    }

    [Fact]
    public async Task AbandonAttack_NaAfgeslagenAanval_HervatDeTimerMeteenZonderNieuwDoelwit()
    {
        // FO §5.4 (herzien 2026-08-04): "Ander gevecht" is het handmatig opgeven van de
        // belegering, óók vóórdat er een nieuw doelwit gekozen is — de timer hoeft dus niet te
        // wachten op een volgende "Gooi" om te hervatten.
        var timeProvider = new FakeTimeProvider(DateTimeOffset.UtcNow);
        await using var factory = CreateFactory(timeProvider, 2, 5);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 5, bobArmies: 5);

        await connection.InvokeAsync<DeclareAttackResponse>(
            "DeclareAttack", gameId, "p1", "alaska", "alberta", 1);
        var afterFight = await connection.InvokeAsync<CombatResultResponse>(
            "ChooseDefenseDice", gameId, "p2", 1, false);
        var remainingAfterFight = afterFight.State.TurnState!.Timer!.RemainingMs;
        Assert.True(afterFight.State.TurnState!.Timer!.IsPaused);

        timeProvider.Advance(TimeSpan.FromSeconds(15));

        var abandoned = await connection.InvokeAsync<GameStateDto>("AbandonAttack", gameId, "p1");

        Assert.False(abandoned.TurnState!.Timer!.IsPaused);
        Assert.Equal(remainingAfterFight - 15_000, abandoned.TurnState!.Timer!.RemainingMs, tolerance: 100);

        // Een tweede "Ander gevecht" zonder tussenliggende nieuwe aanval is geen geldige
        // belegering meer om af te breken.
        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("AbandonAttack", gameId, "p1"));
        Assert.Contains("attack.noAttackToAbandon", exception.Message);
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
            "ChooseDefenseDice", gameId, "p2", 2, false);

        Assert.Equal(0, combatResult.AttackerLosses);
        Assert.Equal(2, combatResult.DefenderLosses);
        Assert.True(combatResult.Conquered);

        var alberta = combatResult.State.Territories.Single(t => t.TerritoryId == "alberta");
        Assert.Equal("p1", alberta.OwnerPlayerId);
        Assert.Equal(0, alberta.ArmyCount);

        // Het gevecht blijft open tot MoveAfterConquest — en dus blijft ook de timer gepauzeerd
        // (FO §5.4): de aanvaller mag ongehaast kiezen hoeveel legers hij meeverplaatst.
        Assert.NotNull(combatResult.State.TurnState!.PendingCombat);
        Assert.True(combatResult.State.TurnState!.Timer!.IsPaused);
        Assert.False(combatResult.State.Players.Single(p => p.Id == "p2").IsEliminated);

        var afterMove = await connection.InvokeAsync<GameStateDto>("MoveAfterConquest", gameId, "p1", 3);

        Assert.Null(afterMove.TurnState!.PendingCombat);
        Assert.False(afterMove.TurnState!.Timer!.IsPaused);
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
            "ChooseDefenseDice", gameId, "p2", 2, false);

        Assert.True(combatResult.Conquered);

        var bob = combatResult.State.Players.Single(p => p.Id == "p2");
        Assert.True(bob.IsEliminated);
    }

    /// <summary>
    /// Zelfde opstelling als <see cref="SetUpAttackStateAsync"/> (Alice/p1 tegen Bob/p2 op
    /// "alaska"/"alberta"), met een derde speler Carol (p3, geen eigen gebied nodig — ze doet
    /// niet mee aan dit gevecht) erbij. <paramref name="missionHolderId"/> ("p1" of "p3")
    /// bepaalt wie <paramref name="mission"/> krijgt, zodat dezelfde helper zowel het
    /// "een ándere speler elimineert het doelwit" - als het "de missiehouder elimineert het
    /// doelwit zelf"-scenario kan opzetten (FO §6.1, <see cref="AttackCommandHandler"/>).
    /// </summary>
    private static async Task<string> SetUpAttackStateWithThirdMissionHolderAsync(
        WebApplicationFactory<Program> factory, IMission mission, string missionHolderId)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");
        var timeProviderNow = factory.Services.GetRequiredService<TimeProvider>().GetUtcNow();

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            SettingsDto.StartingArmiesPresetId,
            TurnTimer: TimeSpan.FromSeconds(SettingsDto.TurnTimerSeconds),
            FortifyTimer: TimeSpan.FromSeconds(SettingsDto.FortifyTimerSeconds),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        var alice = new Player(
            "p1", "Alice", "red", Hand: [], RoleId: null,
            Mission: missionHolderId == "p1" ? mission : null, IsEliminated: false);
        var bob = new Player(
            "p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false);
        var carol = new Player(
            "p3", "Carol", "green", Hand: [], RoleId: null,
            Mission: missionHolderId == "p3" ? mission : null, IsEliminated: false);

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "alaska" => new TerritoryOwnership(territory.Id, "p1", ArmyCount: 4),
                "alberta" => new TerritoryOwnership(territory.Id, "p2", ArmyCount: 2),
                _ => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0),
            })
            .ToArray();

        var state = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            settings,
            players: [alice, bob, carol],
            territories,
            turnOrder: ["p1", "p2", "p3"],
            turnState: new TurnState(
                "p1", TurnPhase.Attack, new PhaseTimer(settings.TurnTimer, timeProviderNow), PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();

        await using var session = store.LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    [Fact]
    public async Task ChooseDefenseDice_VeroveringDoorAndereSpelerDanDeMissiehouder_HerwijstDiensEliminatePlayerMissieOpDeFallback()
    {
        // Carol (p3) houdt "eliminate-blue" (Bob se kleur) — maar Alice (p1), niet Carol,
        // elimineert Bob. FO §6.1: Carol se missie is dan niet vervuld en ze komt automatisch
        // op een fallback-missie uit. De 5 dobbelwaarden dekken de aanval (3) en verdediging
        // (2); de 6e is de willekeurige fallback-categoriekeuze die na de eliminatie volgt
        // (ResolveFallbacksAfterElimination) — met alle 6 ConquerContinents-missies nog
        // ongebruikt maakt de exacte waarde niet uit voor welke van de 6 Carol krijgt, dus de
        // assertie hieronder toetst categorielidmaatschap, niet een specifieke id.
        await using var factory = CreateFactory(6, 5, 1, 2, 1, 0);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");
        var carolMission = (EliminatePlayerMission)map.Missions.Single(mission => mission.Id == "eliminate-blue");

        var gameId = await SetUpAttackStateWithThirdMissionHolderAsync(factory, carolMission, missionHolderId: "p3");

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 3);
        var combatResult = await connection.InvokeAsync<CombatResultResponse>(
            "ChooseDefenseDice", gameId, "p2", 2, false);

        Assert.True(combatResult.Conquered);

        // Niet combatResult.State: dat is het RPC-antwoord aan Bob (de aanroeper van
        // ChooseDefenseDice) en wordt volgens TO §6.1 geredact naar diens eigen perspectief —
        // Carol se MissionId hoort daar sowieso nooit in te staan, ongeacht deze regel. De
        // fallback-toewijzing zelf bewijzen we daarom rechtstreeks op de opgeslagen GameState.
        var store = factory.Services.GetRequiredService<IDocumentStore>();
        await using var session = store.QuerySession();
        var state = await session.LoadAsync<GameState>(gameId);
        var carol = state!.Players.Single(p => p.Id == "p3");
        Assert.NotEqual(carolMission.Id, carol.Mission?.Id);
        Assert.Contains(
            carol.Mission?.Id, map.Missions.OfType<ConquerContinentsMission>().Select(mission => mission.Id));
    }

    [Fact]
    public async Task ChooseDefenseDice_VeroveringDoorDeMissiehouderZelf_LaatDiensEliminatePlayerMissieOnveranderd()
    {
        // Alice (p1) houdt zelf "eliminate-blue" én elimineert Bob (p2) — geen fallback, haar
        // missie blijft staan (telt mee bij de eerstvolgende EndTurn-controle, FO §6.1).
        await using var factory = CreateFactory(6, 5, 1, 2, 1);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");
        var aliceMission = map.Missions.Single(mission => mission.Id == "eliminate-blue");

        var gameId = await SetUpAttackStateWithThirdMissionHolderAsync(factory, aliceMission, missionHolderId: "p1");

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 3);
        var combatResult = await connection.InvokeAsync<CombatResultResponse>(
            "ChooseDefenseDice", gameId, "p2", 2, false);

        Assert.True(combatResult.Conquered);

        // Zelfde reden als in de andere nieuwe test hierboven: combatResult.State is Bob se
        // eigen, geredacte RPC-antwoord en zou Alice se MissionId sowieso nooit tonen — de
        // opgeslagen GameState bewijst rechtstreeks dat haar missie ongewijzigd bleef.
        var store = factory.Services.GetRequiredService<IDocumentStore>();
        await using var session = store.QuerySession();
        var state = await session.LoadAsync<GameState>(gameId);
        var alice = state!.Players.Single(p => p.Id == "p1");
        Assert.Equal("eliminate-blue", alice.Mission?.Id);
    }

    [Fact]
    public async Task ChooseDefenseDice_VeroveringVanLaatsteTegenstander_BeeindigtHetSpelDoorWereldheerschappij()
    {
        // Zelfde worpen/opstelling als ChooseDefenseDice_VeroveringVanLaatsteGebied_SchakeltSpelerUit,
        // maar Alice bezit nu ook de rest van de kaart: deze verovering maakt haar niet alleen
        // Bobs enige overwinnaar, maar ook eigenaar van alle 43 gebieden (FO §6, werelddominantie).
        await using var factory = CreateFactory(6, 5, 1, 2, 1);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);
        await using var spectator = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 4, bobArmies: 2, aliceOwnsRestOfMap: true);
        await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);

        var gameWonReceived = new TaskCompletionSource<GameWonMessage>();
        spectator.On<GameWonMessage>("GameWon", message => gameWonReceived.TrySetResult(message));

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 3);
        var combatResult = await connection.InvokeAsync<CombatResultResponse>(
            "ChooseDefenseDice", gameId, "p2", 2, false);

        Assert.True(combatResult.Conquered);
        Assert.Equal(GamePhaseDto.Finished, combatResult.State.Phase);
        Assert.Equal(["p1"], combatResult.State.Winners);

        // GameWon vuurt hier al binnen ChooseDefenseDice, vóórdat MoveAfterConquest ooit aan
        // de beurt komt — TurnState (met zijn PendingCombat) moet dus mee weggevouwen worden,
        // anders blijft PendingCombat voor altijd hangen en start `useHeldCombat` op de TV zijn
        // houd-timer nooit (bevinding, gebruiker gescreenshot 2026-08-18).
        Assert.Null(combatResult.State.TurnState);

        var gameWon = await gameWonReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal(["p1"], gameWon.WinnerPlayerIds);
        Assert.Equal(combatResult.State.StateVersion, gameWon.StateVersion);
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

        Assert.Contains("attack.notEnoughArmiesToAttack", exception.Message);
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
            connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p1", 2, false));

        Assert.Contains("attack.notTheDefender", exception.Message);
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
            connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2, false));

        Assert.Contains("attack.mustDefendWithOneDie", exception.Message);
    }

    [Fact]
    public async Task ChooseDefenseDice_ZonderVerovering_BroadcastCombatNarratedNaarToeschouwer()
    {
        // Zelfde worpen/opstelling als DeclareAttack_ZonderVerovering_TeltVerliezenAfEnLeegtGevecht.
        await using var factory = CreateFactory(2, 3, 6, 5);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);
        await using var spectator = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 5, bobArmies: 3);
        await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);

        var received = new TaskCompletionSource<CombatNarratedMessage>();
        spectator.On<CombatNarratedMessage>("CombatNarrated", message => received.TrySetResult(message));

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2);
        await connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2, false);

        var narrated = await received.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.Equal("p1", narrated.AttackerId);
        Assert.Equal("p2", narrated.DefenderId);
        Assert.Equal("alaska", narrated.FromTerritoryId);
        Assert.Equal("alberta", narrated.ToTerritoryId);
        Assert.False(narrated.Conquered);
        Assert.Null(narrated.EliminatedPlayerId);
    }

    [Fact]
    public async Task ChooseDefenseDice_VeroveringVanLaatsteGebied_CombatNarratedMeldtEliminatie()
    {
        // Zelfde worpen/opstelling als ChooseDefenseDice_VeroveringVanLaatsteGebied_SchakeltSpelerUit.
        await using var factory = CreateFactory(6, 5, 1, 2, 1);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);
        await using var spectator = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 4, bobArmies: 2);
        await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);

        var received = new TaskCompletionSource<CombatNarratedMessage>();
        spectator.On<CombatNarratedMessage>("CombatNarrated", message => received.TrySetResult(message));

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 3);
        await connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2, false);

        var narrated = await received.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.True(narrated.Conquered);
        Assert.Equal("p2", narrated.EliminatedPlayerId);
    }

    [Fact]
    public async Task ChooseDefenseDice_CombatNarratedStateVersionKomtOvereenMetVolgendeGameStateUpdated()
    {
        await using var factory = CreateFactory(6, 5, 1, 2, 1);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);
        await using var spectator = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 4, bobArmies: 2);
        await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);

        var narratedReceived = new TaskCompletionSource<CombatNarratedMessage>();
        var stateUpdatedReceived = new TaskCompletionSource<GameStateDto>();
        var stateUpdateCount = 0;
        spectator.On<CombatNarratedMessage>("CombatNarrated", message => narratedReceived.TrySetResult(message));
        spectator.On<GameStateDto>("GameStateUpdated", state =>
        {
            // De eerste push komt van DeclareAttack, de tweede van ChooseDefenseDice — alleen
            // die tweede hoort bij het combat-narratief-event van deze test. Verovering houdt
            // PendingCombat open tot MoveAfterConquest, dus die kan niet als filter dienen.
            stateUpdateCount++;

            if (stateUpdateCount == 2)
            {
                stateUpdatedReceived.TrySetResult(state);
            }
        });

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 3);
        await connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2, false);

        var narrated = await narratedReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));
        var stateUpdated = await stateUpdatedReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.Equal(stateUpdated.StateVersion, narrated.StateVersion);
    }

    [Fact]
    public async Task ChooseDefenseDice_CorrelationIdKomtOvereenMetDiceRolledVanDezelfdeActie()
    {
        await using var factory = CreateFactory(2, 3, 6, 5);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);
        await using var spectator = await ConnectAsync(factory, client);

        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 5, bobArmies: 3);
        await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);

        var attackRollReceived = new TaskCompletionSource<DiceRolledMessage>();
        var defenseRollReceived = new TaskCompletionSource<DiceRolledMessage>();
        var narratedReceived = new TaskCompletionSource<CombatNarratedMessage>();
        spectator.On<DiceRolledMessage>("DiceRolled", message =>
        {
            if (message.Context == "attack")
            {
                attackRollReceived.TrySetResult(message);
            }
            else if (message.Context == "defense")
            {
                defenseRollReceived.TrySetResult(message);
            }
        });
        spectator.On<CombatNarratedMessage>("CombatNarrated", message => narratedReceived.TrySetResult(message));

        await connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2);
        await connection.InvokeAsync<CombatResultResponse>("ChooseDefenseDice", gameId, "p2", 2, false);

        var attackRoll = await attackRollReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));
        var defenseRoll = await defenseRollReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));
        var narrated = await narratedReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.NotNull(attackRoll.CorrelationId);
        Assert.Equal(attackRoll.CorrelationId, defenseRoll.CorrelationId);
        Assert.Equal(attackRoll.CorrelationId, narrated.CorrelationId);
    }

    /// <summary>
    /// Twee three-of-a-kind-sets voor de ≥6-inlegtests (FO §7, taak 4) — uit het echte deck
    /// gehaald i.p.v. losstaand geconstrueerd: <see cref="RiskGame.Rules.Reinforcement.CardTradeCalculator.Evaluate"/>
    /// zoekt <c>card.TerritoryId</c> op in <c>state.Territory(...)</c>, dus een zelfverzonnen
    /// territory-id zou daar een <see cref="KeyNotFoundException"/> opleveren (anders dan bij
    /// de pure <c>ReinforceGuards</c>-tests in Rules.Tests, die geen territory-lookup doen).
    /// </summary>
    private static Card[] SixCardHand(IReadOnlyList<Card> deck)
    {
        var groups = deck.Where(card => !card.IsJoker).GroupBy(card => card.Symbol)
            .Where(group => group.Count() >= 3).Take(2).ToArray();

        return [.. groups[0].Take(3), .. groups[1].Take(3)];
    }

    /// <summary>Drie three-of-a-kind-sets: na één inleg blijven er nog 6 over (nog steeds ≥6).</summary>
    private static Card[] NineCardHand(IReadOnlyList<Card> deck)
    {
        var groups = deck.Where(card => !card.IsJoker).GroupBy(card => card.Symbol)
            .Where(group => group.Count() >= 3).Take(3).ToArray();

        return [.. groups[0].Take(3), .. groups[1].Take(3), .. groups[2].Take(3)];
    }

    [Fact]
    public async Task DeclareAttack_MetZesOfMeerKaartenInHand_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var gameId = await SetUpAttackStateAsync(
            factory, aliceArmies: 3, bobArmies: 1, aliceHand: SixCardHand(mapSource.Load("standaard-43").Deck));

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2));

        Assert.Contains("reinforce.mustTradeInCardsFirst", exception.Message);
    }

    /// <summary>
    /// FO §7 (taak 4): eerst inleggen, dan de opbrengst plaatsen, dan pas weer aanvallen
    /// toegestaan — end-to-end via de drie betrokken hub-commando's.
    /// </summary>
    [Fact]
    public async Task TradeInCards_InAanvallenMetZesOfMeerKaarten_MaaktAanvallenPasNaPlaatsenWeerMogelijk()
    {
        await using var factory = CreateFactory(6, 4);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var hand = SixCardHand(mapSource.Load("standaard-43").Deck);
        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 3, bobArmies: 1, aliceHand: hand);

        var afterTrade = await connection.InvokeAsync<GameStateDto>(
            "TradeInCards", gameId, "p1", hand.Take(3).Select(card => card.Id).ToArray());

        // Eerste inleg levert altijd 4 op (FO §4.4); hand is nu 3, dus de ≥6-vlag is weg.
        Assert.Equal(4, afterTrade.TurnState!.ArmiesRemaining);
        Assert.False(afterTrade.TurnState.MustTradeInCards);

        var stillBlocked = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<DeclareAttackResponse>("DeclareAttack", gameId, "p1", "alaska", "alberta", 2));
        Assert.Contains("turnFlow.armiesRemaining", stillBlocked.Message);

        var afterPlace = await connection.InvokeAsync<GameStateDto>(
            "PlaceReinforcements", gameId, "p1", "alaska", 4);
        Assert.Equal(0, afterPlace.TurnState!.ArmiesRemaining);

        var declared = await connection.InvokeAsync<DeclareAttackResponse>(
            "DeclareAttack", gameId, "p1", "alaska", "alberta", 2);
        Assert.Equal(TurnPhaseDto.Attack, declared.State.TurnState!.TurnPhase);
    }

    /// <summary>Meerdere sets nodig (≥9 kaarten): de vlag blijft staan na de eerste inleg.</summary>
    [Fact]
    public async Task MustTradeInCards_InAanvallenMetNegenKaarten_BlijftWaarNaEenEersteInleg()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var hand = NineCardHand(mapSource.Load("standaard-43").Deck);
        var gameId = await SetUpAttackStateAsync(factory, aliceArmies: 3, bobArmies: 1, aliceHand: hand);

        var afterTrade = await connection.InvokeAsync<GameStateDto>(
            "TradeInCards", gameId, "p1", hand.Take(3).Select(card => card.Id).ToArray());

        Assert.True(afterTrade.TurnState!.MustTradeInCards);
    }
}
