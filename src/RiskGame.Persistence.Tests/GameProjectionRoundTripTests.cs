using RiskGame.Persistence.Events;
using RiskGame.Persistence.Map;
using RiskGame.Persistence.Projections;
using RiskGame.Persistence.Store;
using RiskGame.Rules.Effects;
using RiskGame.Rules.State;

namespace RiskGame.Persistence.Tests;

/// <summary>
/// Bewijst de herstel-garantie uit TO §9: append events → de live, inline-geprojecteerde
/// <see cref="GameState"/> (wat een client na een commando te zien krijgt) moet identiek
/// zijn aan een onafhankelijk vanaf de rauwe events opnieuw opgebouwde projectie (wat een
/// crash-herstel of reconnect zou opleveren, FO §11.1).
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameProjectionRoundTripTests(PostgresFixture postgres)
{
    private static readonly string MapsRoot =
        Path.Combine(AppContext.BaseDirectory, "data", "maps");

    private static readonly GameSettings Settings = new(
        WinCondition.SecretMissions,
        SetupMode.Claiming,
        StartingArmies: 25,
        TurnTimer: TimeSpan.FromMinutes(3),
        FortifyTimer: TimeSpan.FromMinutes(1),
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentMode.Random,
        EventsEnabled: false);

    [Fact]
    public async Task LiveProjectieEnReplayVanuitRuweEvents_LeverenIdentiekeGameStateOp()
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = new MapDefinitionSource(MapsRoot);
        var now = DateTimeOffset.UtcNow;

        await using var store = GameStoreFactory.Create(postgres.ConnectionString, mapSource);
        await using var session = store.LightweightSession();

        session.Events.StartStream<GameState>(
            gameId,
            new GameCreated(gameId, "standaard-43", Settings),
            new PlayerJoined(gameId, "p1", "Alice", IsHost: true),
            new ColorChosen(gameId, "p1", "red"),
            new PlayerJoined(gameId, "p2", "Bob", IsHost: false),
            new ColorChosen(gameId, "p2", "blue"),
            new OrderRolled(gameId, "p1", Die1: 6, Die2: 4),
            new OrderRolled(gameId, "p2", Die1: 3, Die2: 2),
            new TurnOrderDetermined(gameId, ["p1", "p2"]),
            new TerritoryClaimed(gameId, "p1", "alaska"),
            new TerritoryClaimed(gameId, "p2", "northwest-territory"),
            new InitialArmyPlaced(gameId, "p1", "alaska"),
            new RoleAssigned(gameId, "p1", "diplomaat"),
            new MissionAssigned(gameId, "p1", "eliminate-blue"),
            new MissionAssigned(gameId, "p2", "territory-24"),
            new PhaseChanged(gameId, "p1", TurnPhase.Reinforce, Settings.TurnTimer, now),
            new ArmiesReinforced(gameId, "p1", "alaska", 3),
            new PhaseChanged(gameId, "p1", TurnPhase.Attack, Settings.TurnTimer, now.AddSeconds(1)),
            new AttackDeclared(
                gameId, "p1", "alaska", "northwest-territory", AttackDice: 2,
                Remaining: Settings.TurnTimer, OccurredAtUtc: now.AddSeconds(2)),
            new DiceRolled(gameId, "p1", [6, 4]),
            new DiceRolled(gameId, "p2", [3]),
            new CombatResolved(
                gameId, "p1", "alaska", "northwest-territory",
                AttackerRolls: [6, 4], DefenderRolls: [3], AttackerLosses: 0, DefenderLosses: 1,
                OccurredAtUtc: null),
            new TerritoryConquered(gameId, "p1", "northwest-territory"),
            new ArmiesMovedAfterConquest(
                gameId, "p1", "alaska", "northwest-territory", 2, now.AddSeconds(3)),
            new PhaseChanged(gameId, "p1", TurnPhase.Fortify, Settings.FortifyTimer, now.AddSeconds(4)),
            new Fortified(gameId, "p1", "northwest-territory", "alaska", 1),
            new TurnEnded(gameId, "p1"),
            new PhaseChanged(gameId, "p2", TurnPhase.Reinforce, Settings.TurnTimer, now.AddSeconds(5)));

        await session.SaveChangesAsync();

        var live = await session.LoadAsync<GameState>(gameId);
        var replayed = await ReplayFromRawEventsAsync(session, gameId, mapSource);

        Assert.NotNull(live);
        Assert.NotNull(replayed);

        AssertIdenticalGameState(live!, replayed!);
    }

    /// <summary>
    /// Nog geen event vult <see cref="GameState.ActiveEffects"/> (dat komt bij een latere
    /// plak), dus deze test bewijst de serialisatie van <see cref="ActiveEffect.Effect"/>
    /// (<see cref="RiskGame.Rules.Effects.IEffect"/>, hetzelfde polymorfe-type-probleem als
    /// <see cref="Rules.State.Player.Mission"/>) los van de event-stream, door een
    /// <see cref="GameState"/> rechtstreeks te bouwen en te bewaren.
    /// </summary>
    [Fact]
    public async Task ActiveEffectMetEenEchtGebeurtenisEffect_OverleeftEenMartenRoundTrip()
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = new MapDefinitionSource(MapsRoot);
        var map = mapSource.Load("standaard-43");
        var effect = map.Events.First().Effect;

        await using var store = GameStoreFactory.Create(postgres.ConnectionString, mapSource);
        await using var session = store.LightweightSession();

        var state = new GameState(
            gameId,
            map,
            GamePhase.Lobby,
            Settings,
            players: [],
            territories: [],
            turnOrder: [],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: [new ActiveEffect(effect, RoundsRemaining: 1)]);

        session.Store(state);
        await session.SaveChangesAsync();

        var reloaded = await session.LoadAsync<GameState>(gameId);

        Assert.NotNull(reloaded);
        var activeEffect = Assert.Single(reloaded!.ActiveEffects);
        Assert.Equal(effect.Id, activeEffect.Effect.Id);
        Assert.Equal(1, activeEffect.RoundsRemaining);
    }

    /// <summary>
    /// <see cref="CardsTraded"/> vereist een speler met kaarten in de hand — die komen er
    /// pas via <c>CardDrawn</c> (TO §5.2, nog niet gebouwd, een latere plak), dus deze test
    /// bouwt de startsituatie rechtstreeks in plaats van via de event-stream, net als de
    /// vorige test. Bewijst zowel de vouwregel (hand/aflegstapel/inlegwaarde/bezitsbonus)
    /// als dat het resultaat een Marten-round-trip overleeft.
    /// </summary>
    [Fact]
    public async Task CardsTraded_VouwtHandAflegstapelEnBezitsbonusEnOverleeftEenMartenRoundTrip()
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = new MapDefinitionSource(MapsRoot);
        var map = mapSource.Load("standaard-43");

        var ownedCard = new Rules.Map.Card("card-alaska", "alaska", "symbol-1");
        var otherCard1 = new Rules.Map.Card("card-siberia", "siberia", "symbol-2");
        var otherCard2 = new Rules.Map.Card("card-brazil", "brazil", "symbol-3");

        var player = new Player(
            "p1", "Alice", "red", Hand: [ownedCard, otherCard1, otherCard2],
            RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false);

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(
                territory.Id,
                OwnerPlayerId: territory.Id == "alaska" ? "p1" : null,
                ArmyCount: territory.Id == "alaska" ? 1 : 0))
            .ToArray();

        var initialState = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            Settings,
            players: [player],
            territories,
            turnOrder: ["p1"],
            turnState: new TurnState("p1", TurnPhase.Reinforce, new PhaseTimer(Settings.TurnTimer, DateTimeOffset.UtcNow), PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var projection = new GameProjection(mapSource);
        var result = projection.Apply(
            initialState,
            new CardsTraded(gameId, "p1", ["card-alaska", "card-siberia", "card-brazil"]));

        Assert.Empty(result.Player("p1").Hand);
        Assert.Equal([ownedCard, otherCard1, otherCard2], result.Deck.DiscardPile);
        Assert.Equal(6, result.Deck.NextTradeValue);
        Assert.Equal(1 + map.SetRules.OwnedTerritoryBonus, result.Territory("alaska").ArmyCount);

        await using var store = GameStoreFactory.Create(postgres.ConnectionString, mapSource);

        // Deze test slaat rechtstreeks een document op zonder eerst events te appenden
        // (zie doc-comment hierboven); zonder eerdere event-stream-actie in dit
        // testproces bestaat het Marten-schema soms nog niet, vandaar expliciet.
        await store.Storage.ApplyAllConfiguredChangesToDatabaseAsync();

        await using var session = store.LightweightSession();

        session.Store(result);
        await session.SaveChangesAsync();

        var reloaded = await session.LoadAsync<GameState>(gameId);

        Assert.NotNull(reloaded);
        Assert.Empty(reloaded!.Player("p1").Hand);
        Assert.Equal([ownedCard, otherCard1, otherCard2], reloaded.Deck.DiscardPile);
        Assert.Equal(6, reloaded.Deck.NextTradeValue);
        Assert.Equal(1 + map.SetRules.OwnedTerritoryBonus, reloaded.Territory("alaska").ArmyCount);
    }

    /// <summary>
    /// <see cref="TurnState.ArmiesRemaining"/> wordt bij het ingaan van Versterken gezet op
    /// <see cref="Rules.Reinforcement.ReinforcementCalculator.CalculateArmies"/> (hier: 1
    /// gebied, dus het minimum van 3), daarna afgeteld door <see cref="ArmiesReinforced"/> en
    /// opgehoogd door de setwaarde van <see cref="CardsTraded"/> (FO §5.2).
    /// </summary>
    [Fact]
    public void ArmiesRemaining_WordtGezetBijPhaseChangedEnBijgewerktDoorReinforceEnCardsTraded()
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = new MapDefinitionSource(MapsRoot);
        var map = mapSource.Load("standaard-43");

        var ownedCard = new Rules.Map.Card("card-alaska", "alaska", "symbol-1");
        var otherCard1 = new Rules.Map.Card("card-siberia", "siberia", "symbol-2");
        var otherCard2 = new Rules.Map.Card("card-brazil", "brazil", "symbol-3");

        var player = new Player(
            "p1", "Alice", "red", Hand: [ownedCard, otherCard1, otherCard2],
            RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false);

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(
                territory.Id,
                OwnerPlayerId: territory.Id == "alaska" ? "p1" : null,
                ArmyCount: territory.Id == "alaska" ? 1 : 0))
            .ToArray();

        var initialState = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            Settings,
            players: [player],
            territories,
            turnOrder: ["p1"],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var projection = new GameProjection(mapSource);

        var afterPhaseChanged = projection.Apply(
            initialState,
            new PhaseChanged(gameId, "p1", TurnPhase.Reinforce, Settings.TurnTimer, DateTimeOffset.UtcNow));
        Assert.Equal(3, afterPhaseChanged.TurnState!.ArmiesRemaining);

        var afterReinforce = projection.Apply(afterPhaseChanged, new ArmiesReinforced(gameId, "p1", "alaska", 2));
        Assert.Equal(1, afterReinforce.TurnState!.ArmiesRemaining);

        var afterTrade = projection.Apply(
            afterReinforce, new CardsTraded(gameId, "p1", ["card-alaska", "card-siberia", "card-brazil"]));
        Assert.Equal(1 + 4, afterTrade.TurnState!.ArmiesRemaining);
    }

    /// <summary>
    /// <see cref="CardDrawn"/> vereist een gevulde <see cref="DeckState.DrawPile"/> — die
    /// wordt in <see cref="GameProjection.Create"/> nog leeg geïnitialiseerd (het deck zelf
    /// bouwen uit de kaartdata is nog niet aangesloten, geen scope van deze plak), dus deze
    /// test bouwt de startsituatie rechtstreeks, net als <see cref="CardsTraded_VouwtHandAflegstapelEnBezitsbonusEnOverleeftEenMartenRoundTrip"/>.
    /// </summary>
    [Fact]
    public async Task CardDrawn_VouwtTrekstapelEnHandEnOverleeftEenMartenRoundTrip()
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = new MapDefinitionSource(MapsRoot);
        var map = mapSource.Load("standaard-43");

        var drawnCard = new Rules.Map.Card("card-japan", "japan", "symbol-2");
        var remainingCard = new Rules.Map.Card("card-china", "china", "symbol-3");

        var player = new Player(
            "p1", "Alice", "red", Hand: [],
            RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false);

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0))
            .ToArray();

        var initialState = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            Settings,
            players: [player],
            territories,
            turnOrder: ["p1"],
            turnState: new TurnState("p1", TurnPhase.Attack, new PhaseTimer(Settings.TurnTimer, DateTimeOffset.UtcNow), PendingCombat: null),
            deck: new DeckState(DrawPile: [drawnCard, remainingCard], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var projection = new GameProjection(mapSource);
        var result = projection.Apply(initialState, new CardDrawn(gameId, "p1", "card-japan"));

        Assert.Equal([drawnCard], result.Player("p1").Hand);
        Assert.Equal([remainingCard], result.Deck.DrawPile);

        await using var store = GameStoreFactory.Create(postgres.ConnectionString, mapSource);
        await store.Storage.ApplyAllConfiguredChangesToDatabaseAsync();

        await using var session = store.LightweightSession();

        session.Store(result);
        await session.SaveChangesAsync();

        var reloaded = await session.LoadAsync<GameState>(gameId);

        Assert.NotNull(reloaded);
        Assert.Equal([drawnCard], reloaded!.Player("p1").Hand);
        Assert.Equal([remainingCard], reloaded.Deck.DrawPile);
    }

    /// <summary>
    /// <see cref="PlayerEliminated"/> vouwt zowel de handoverdracht als wíe uitschakelde
    /// (FO §7, §6.1) — de veroveraar krijgt de handkaarten van de uitgeschakelde speler.
    /// </summary>
    [Fact]
    public async Task PlayerEliminated_VouwtHandoverdrachtEnUitschakelingEnOverleeftEenMartenRoundTrip()
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = new MapDefinitionSource(MapsRoot);
        var map = mapSource.Load("standaard-43");

        var eliminatedCard = new Rules.Map.Card("card-japan", "japan", "symbol-2");
        var conquerorCard = new Rules.Map.Card("card-china", "china", "symbol-3");

        var eliminated = new Player(
            "p2", "Bob", "blue", Hand: [eliminatedCard],
            RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false);
        var conqueror = new Player(
            "p1", "Alice", "red", Hand: [conquerorCard],
            RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: false);

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0))
            .ToArray();

        var initialState = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            Settings,
            players: [conqueror, eliminated],
            territories,
            turnOrder: ["p1", "p2"],
            turnState: new TurnState("p1", TurnPhase.Attack, new PhaseTimer(Settings.TurnTimer, DateTimeOffset.UtcNow), PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var projection = new GameProjection(mapSource);
        var result = projection.Apply(initialState, new PlayerEliminated(gameId, "p2", "p1"));

        Assert.True(result.Player("p2").IsEliminated);
        Assert.Equal("p1", result.Player("p2").EliminatedByPlayerId);
        Assert.Empty(result.Player("p2").Hand);
        Assert.Equal([conquerorCard, eliminatedCard], result.Player("p1").Hand);

        await using var store = GameStoreFactory.Create(postgres.ConnectionString, mapSource);
        await store.Storage.ApplyAllConfiguredChangesToDatabaseAsync();

        await using var session = store.LightweightSession();

        session.Store(result);
        await session.SaveChangesAsync();

        var reloaded = await session.LoadAsync<GameState>(gameId);

        Assert.NotNull(reloaded);
        Assert.True(reloaded!.Player("p2").IsEliminated);
        Assert.Equal("p1", reloaded.Player("p2").EliminatedByPlayerId);
        Assert.Equal([conquerorCard, eliminatedCard], reloaded.Player("p1").Hand);
    }

    /// <summary>
    /// <see cref="EffectApplied"/> met een instant effect (<c>goede-oogst</c>,
    /// <c>ContinentOwnerBonus</c>) past de al berekende legerdeltas toe en komt niet in
    /// <see cref="GameState.ActiveEffects"/> terecht (FO §9.2).
    /// </summary>
    [Fact]
    public async Task EffectApplied_MetInstantEffect_PastLegerDeltasToeZonderActiveEffectEnOverleeftEenMartenRoundTrip()
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = new MapDefinitionSource(MapsRoot);
        var map = mapSource.Load("standaard-43");

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(
                territory.Id, OwnerPlayerId: null, ArmyCount: territory.Id == "alaska" ? 3 : 0))
            .ToArray();

        var initialState = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            Settings,
            players: [],
            territories,
            turnOrder: [],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var projection = new GameProjection(mapSource);
        var result = projection.Apply(
            initialState,
            new EffectApplied(gameId, "goede-oogst", new Dictionary<string, int> { ["alaska"] = 2 }));

        Assert.Equal(5, result.Territory("alaska").ArmyCount);
        Assert.Empty(result.ActiveEffects);

        await using var store = GameStoreFactory.Create(postgres.ConnectionString, mapSource);
        await store.Storage.ApplyAllConfiguredChangesToDatabaseAsync();

        await using var session = store.LightweightSession();

        session.Store(result);
        await session.SaveChangesAsync();

        var reloaded = await session.LoadAsync<GameState>(gameId);

        Assert.NotNull(reloaded);
        Assert.Equal(5, reloaded!.Territory("alaska").ArmyCount);
        Assert.Empty(reloaded.ActiveEffects);
    }

    /// <summary>
    /// <see cref="EffectApplied"/> met een <c>oneRound</c>-effect (<c>stormachtige-zeeen</c>,
    /// <c>SeaRoutesBlocked</c>) draagt geen legerdeltas maar voegt wél een
    /// <see cref="ActiveEffect"/> toe, zodat de TV het permanent kan tonen (FO §9.2).
    /// </summary>
    [Fact]
    public void EffectApplied_MetOneRoundEffect_VoegtActiveEffectToe()
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = new MapDefinitionSource(MapsRoot);
        var map = mapSource.Load("standaard-43");

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0))
            .ToArray();

        var initialState = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            Settings,
            players: [],
            territories,
            turnOrder: [],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var projection = new GameProjection(mapSource);
        var result = projection.Apply(
            initialState,
            new EffectApplied(gameId, "stormachtige-zeeen", new Dictionary<string, int>()));

        var activeEffect = Assert.Single(result.ActiveEffects);
        Assert.Equal("stormachtige-zeeen", activeEffect.Effect.Id);
        Assert.Equal(1, activeEffect.RoundsRemaining);
    }

    /// <summary>
    /// <see cref="EffectExpired"/> verwijdert de bijbehorende <see cref="ActiveEffect"/> aan
    /// het einde van de ronde (FO §9.2).
    /// </summary>
    [Fact]
    public void EffectExpired_VerwijdertActiveEffect()
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = new MapDefinitionSource(MapsRoot);
        var map = mapSource.Load("standaard-43");
        var effect = map.Events.First(e => e.Id == "stormachtige-zeeen").Effect;

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0))
            .ToArray();

        var initialState = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            Settings,
            players: [],
            territories,
            turnOrder: [],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: [new ActiveEffect(effect, RoundsRemaining: 1)]);

        var projection = new GameProjection(mapSource);
        var result = projection.Apply(initialState, new EffectExpired(gameId, "stormachtige-zeeen"));

        Assert.Empty(result.ActiveEffects);
    }

    /// <summary>
    /// <see cref="GameWon"/> sluit het spel af: fase naar <see cref="GamePhase.Finished"/>
    /// en de winnaars vastgelegd op <see cref="GameState.Winners"/> (FO §7).
    /// </summary>
    [Fact]
    public async Task GameWon_VouwtFaseEnWinnaarsEnOverleeftEenMartenRoundTrip()
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = new MapDefinitionSource(MapsRoot);
        var map = mapSource.Load("standaard-43");

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(territory.Id, OwnerPlayerId: "p1", ArmyCount: 1))
            .ToArray();

        var initialState = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            Settings,
            players: [],
            territories,
            turnOrder: ["p1"],
            turnState: new TurnState("p1", TurnPhase.Attack, new PhaseTimer(Settings.TurnTimer, DateTimeOffset.UtcNow), PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var projection = new GameProjection(mapSource);
        var result = projection.Apply(initialState, new GameWon(gameId, ["p1"]));

        Assert.Equal(GamePhase.Finished, result.Phase);
        Assert.Equal(["p1"], result.Winners);

        await using var store = GameStoreFactory.Create(postgres.ConnectionString, mapSource);
        await store.Storage.ApplyAllConfiguredChangesToDatabaseAsync();

        await using var session = store.LightweightSession();

        session.Store(result);
        await session.SaveChangesAsync();

        var reloaded = await session.LoadAsync<GameState>(gameId);

        Assert.NotNull(reloaded);
        Assert.Equal(GamePhase.Finished, reloaded!.Phase);
        Assert.Equal(["p1"], reloaded.Winners);
    }

    /// <summary>
    /// Bouwt de projectie onafhankelijk van Martens opgeslagen snapshot opnieuw op, puur
    /// vanuit de rauwe events — dit is de herstel-garantie zelf (TO §9), niet een kopie van
    /// wat er al in de database staat.
    /// </summary>
    private static async Task<GameState> ReplayFromRawEventsAsync(
        Marten.IDocumentSession session, string gameId, IMapDefinitionSource mapSource)
    {
        var rawEvents = await session.Events.FetchStreamAsync(gameId);
        var projection = new GameProjection(mapSource);

        GameState? state = null;

        foreach (var @event in rawEvents)
        {
            state = @event.Data switch
            {
                GameCreated created => projection.Create(created),
                PlayerJoined joined => projection.Apply(state!, joined),
                ColorChosen chosen => projection.Apply(state!, chosen),
                OrderRolled => state!,
                TurnOrderDetermined determined => projection.Apply(state!, determined),
                TerritoryClaimed claimed => projection.Apply(state!, claimed),
                InitialArmyPlaced placed => projection.Apply(state!, placed),
                RoleAssigned roleAssigned => projection.Apply(state!, roleAssigned),
                MissionAssigned missionAssigned => projection.Apply(state!, missionAssigned),
                PhaseChanged phaseChanged => projection.Apply(state!, phaseChanged),
                ArmiesReinforced armiesReinforced => projection.Apply(state!, armiesReinforced),
                TurnEnded => state!,
                AttackDeclared attackDeclared => projection.Apply(state!, attackDeclared),
                DiceRolled => state!,
                CombatResolved combatResolved => projection.Apply(state!, combatResolved),
                TerritoryConquered territoryConquered => projection.Apply(state!, territoryConquered),
                ArmiesMovedAfterConquest armiesMovedAfterConquest =>
                    projection.Apply(state!, armiesMovedAfterConquest),
                Fortified fortified => projection.Apply(state!, fortified),
                PlayerEliminated playerEliminated => projection.Apply(state!, playerEliminated),
                EventCardDrawn => state!,
                EffectApplied effectApplied => projection.Apply(state!, effectApplied),
                EffectExpired effectExpired => projection.Apply(state!, effectExpired),
                MissionCompleted => state!,
                GameWon gameWon => projection.Apply(state!, gameWon),
                var unexpected => throw new InvalidOperationException(
                    $"Onbekend event-type in de teststream: {unexpected.GetType()}"),
            };
        }

        return state ?? throw new InvalidOperationException("Geen events gevonden om te herspelen.");
    }

    /// <remarks>
    /// <see cref="Player"/> en <see cref="DeckState"/> hebben zelf een lijst-property
    /// (<c>Hand</c>, resp. <c>DrawPile</c>/<c>DiscardPile</c>). De record-gegenereerde
    /// <c>Equals</c> daarvan vergelijkt zo'n lijst niet inhoudelijk maar via
    /// <c>object.Equals</c> (arrays/lijsten overschrijven die niet) — twee inhoudelijk
    /// gelijke maar apart opgebouwde lege lijsten (hier: JSON-deserialisatie levert een
    /// <c>List&lt;Card&gt;</c>, in-memory een <c>Card[]</c>) tellen dan als ongelijk. Daarom
    /// hier per veld vergelijken in plaats van in één keer op het record: zo doet xUnit de
    /// inhoudelijke lijstvergelijking zelf, in plaats van te stuiten op die shortcut.
    /// </remarks>
    private static void AssertIdenticalGameState(GameState expected, GameState actual)
    {
        Assert.Equal(expected.GameId, actual.GameId);
        Assert.Equal(expected.Phase, actual.Phase);
        Assert.Equal(expected.Settings, actual.Settings);
        Assert.Equal(expected.Territories, actual.Territories);
        Assert.Equal(expected.TurnOrder, actual.TurnOrder);
        Assert.Equal(expected.TurnState, actual.TurnState);
        Assert.Equal(expected.ActiveEffects, actual.ActiveEffects);
        Assert.Equal(expected.Winners, actual.Winners);

        Assert.Equal(expected.Deck.NextTradeValue, actual.Deck.NextTradeValue);
        Assert.Equal(expected.Deck.DrawPile, actual.Deck.DrawPile);
        Assert.Equal(expected.Deck.DiscardPile, actual.Deck.DiscardPile);

        Assert.Equal(expected.Players.Count, actual.Players.Count);
        foreach (var (expectedPlayer, actualPlayer) in expected.Players.Zip(actual.Players))
        {
            Assert.Equal(expectedPlayer.Id, actualPlayer.Id);
            Assert.Equal(expectedPlayer.Name, actualPlayer.Name);
            Assert.Equal(expectedPlayer.ColorId, actualPlayer.ColorId);
            Assert.Equal(expectedPlayer.Hand, actualPlayer.Hand);
            Assert.Equal(expectedPlayer.RoleId, actualPlayer.RoleId);
            Assert.Equal(expectedPlayer.Mission, actualPlayer.Mission);
            Assert.Equal(expectedPlayer.IsEliminated, actualPlayer.IsEliminated);
            Assert.Equal(expectedPlayer.IsAutoPass, actualPlayer.IsAutoPass);
            Assert.Equal(expectedPlayer.EliminatedByPlayerId, actualPlayer.EliminatedByPlayerId);
        }

        Assert.Equal(expected.Map.MapId, actual.Map.MapId);
        Assert.Equal(expected.Map.Territories, actual.Map.Territories);
        Assert.Equal(expected.Map.Continents, actual.Map.Continents);
        Assert.Equal(expected.Map.Colors, actual.Map.Colors);
        Assert.Equal(expected.Map.Borders, actual.Map.Borders);
        Assert.Equal(expected.Map.Deck, actual.Map.Deck);
        Assert.Equal(expected.Map.Roles, actual.Map.Roles);
        Assert.Equal(expected.Map.Adjacency, actual.Map.Adjacency);
    }
}
