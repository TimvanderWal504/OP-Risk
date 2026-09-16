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
using RiskGame.Rules.Missions;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst de TO §4-pijplijn voor <c>Fortify</c>, <c>EndPhase</c> en <c>EndTurn</c>
/// (FO §5.2, §5.5) end-to-end. Zelfde opzet als <see cref="GameHubAttackTests"/>: het spel
/// wordt rechtstreeks in de gewenste startsituatie opgebouwd, geen dobbelen nodig.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubTurnFlowTests(PostgresFixture postgres)
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

    private WebApplicationFactory<Program> CreateFactory(IRandomSource? randomSource = null) =>
        ApiTestHost.Create(
            postgres, services => services.AddSingleton<IRandomSource>(randomSource ?? new SequenceRandomSource()));

    private static Task<HubConnection> ConnectAsync(WebApplicationFactory<Program> factory, HttpClient client) =>
        ApiTestHost.ConnectAsync(factory, client);

    /// <summary>
    /// Bouwt een spel rechtstreeks op met "alaska" (p1) grenzend aan "alberta" (p1 of p2,
    /// zelfde adjacency-paar als <see cref="GameHubAttackTests"/>), in de opgegeven
    /// <paramref name="turnPhase"/> voor p1, met p2 als tweede speler in de beurtvolgorde.
    /// </summary>
    /// <param name="aliceMissionId">
    /// Missie-id uit <c>missions.json</c>, niet een los <see cref="IMission"/>-object: net als
    /// <see cref="Player.RoleId"/> komt een missie altijd uit de kaartcatalogus —
    /// <c>MissionJsonConverter</c> slaat alleen de id op en zoekt 'm bij het lezen terug op in
    /// <see cref="MapDefinition.Missions"/>, dus een zelfverzonnen id/object zou bij de eerste
    /// <c>WatchGame</c>/reload al stuklopen.
    /// </param>
    private static async Task<string> SetUpStateAsync(
        WebApplicationFactory<Program> factory,
        TurnPhase turnPhase,
        string albertaOwnerId,
        int albertaArmies,
        PendingCombat? pendingCombat = null,
        IReadOnlyList<string>? extraTerritoriesForP2 = null,
        int armiesRemaining = 0,
        string? aliceMissionId = null,
        bool aliceOwnsRestOfMap = false,
        bool bobIsEliminated = false,
        string? bobEliminatedByPlayerId = null,
        bool hasConqueredThisTurn = false,
        IReadOnlyList<string>? drawPileCardIds = null,
        IReadOnlyList<string>? discardPileCardIds = null,
        IReadOnlyList<string>? aliceHandCardIds = null)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            SettingsDto.StartingArmiesPresetId,
            TurnTimer: TimeSpan.FromSeconds(SettingsDto.TurnTimerSeconds),
            FortifyTimer: TimeSpan.FromSeconds(SettingsDto.FortifyTimerSeconds),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        var aliceMission = aliceMissionId is null ? null : map.Missions.Single(mission => mission.Id == aliceMissionId);

        // Uit het echte, opgebouwde deck gehaald i.p.v. losstaand geconstrueerd: CardDrawn en
        // DeckShuffled zoeken kaarten op in map.Deck/state.Deck.DrawPile, dus een zelfverzonnen
        // symbool zou daar niet mee overeenkomen (zelfde valkuil als in Persistence.Tests).
        var cardsById = map.Deck.ToDictionary(card => card.Id);

        var alice = new Player(
            "p1", "Alice", "red",
            Hand: [.. (aliceHandCardIds ?? []).Select(id => cardsById[id])],
            RoleId: null, Mission: aliceMission, IsEliminated: false);
        var bob = new Player(
            "p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null,
            IsEliminated: bobIsEliminated, EliminatedByPlayerId: bobEliminatedByPlayerId);

        var extraForP2 = extraTerritoriesForP2 ?? [];

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "alaska" => new TerritoryOwnership(territory.Id, "p1", ArmyCount: 5),
                "alberta" => new TerritoryOwnership(territory.Id, albertaOwnerId, albertaArmies),
                _ when extraForP2.Contains(territory.Id) =>
                    new TerritoryOwnership(territory.Id, "p2", ArmyCount: 1),
                _ when aliceOwnsRestOfMap => new TerritoryOwnership(territory.Id, "p1", ArmyCount: 1),
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
                "p1", turnPhase, new PhaseTimer(settings.TurnTimer, DateTimeOffset.UtcNow), pendingCombat,
                ArmiesRemaining: armiesRemaining, HasConqueredThisTurn: hasConqueredThisTurn),
            deck: new DeckState(
                DrawPile: [.. (drawPileCardIds ?? []).Select(id => cardsById[id])],
                DiscardPile: [.. (discardPileCardIds ?? []).Select(id => cardsById[id])],
                NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();

        await using var session = store.LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    [Fact]
    public async Task Fortify_MetAaneengeslotenPad_VerplaatstLegers()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Fortify, albertaOwnerId: "p1", albertaArmies: 1);

        var updated = await connection.InvokeAsync<GameStateDto>(
            "Fortify", gameId, "p1", "alaska", "alberta", 3);

        Assert.Equal(2, updated.Territories.Single(t => t.TerritoryId == "alaska").ArmyCount);
        Assert.Equal(4, updated.Territories.Single(t => t.TerritoryId == "alberta").ArmyCount);
    }

    [Fact]
    public async Task Fortify_NaarNietEigenGebied_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Fortify, albertaOwnerId: "p2", albertaArmies: 1);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("Fortify", gameId, "p1", "alaska", "alberta", 3));

        Assert.Contains("common.territoryNotOwned", exception.Message);
    }

    [Fact]
    public async Task EndPhase_VanuitVersterken_GaatNaarAanvallen()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Reinforce, albertaOwnerId: "p2", albertaArmies: 1);

        var updated = await connection.InvokeAsync<GameStateDto>("EndPhase", gameId, "p1");

        Assert.Equal(TurnPhaseDto.Attack, updated.TurnState!.TurnPhase);
        Assert.Equal("p1", updated.TurnState.ActivePlayerId);
    }

    [Fact]
    public async Task EndPhase_VanuitVersterkenMetOngeplaatsteLegers_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory, TurnPhase.Reinforce, albertaOwnerId: "p2", albertaArmies: 1, armiesRemaining: 3);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("EndPhase", gameId, "p1"));

        Assert.Contains("turnFlow.armiesRemaining", exception.Message);
    }

    [Fact]
    public async Task EndPhase_VanuitAanvallenZonderLopendGevecht_GaatNaarVerplaatsen()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Attack, albertaOwnerId: "p2", albertaArmies: 1);

        var updated = await connection.InvokeAsync<GameStateDto>("EndPhase", gameId, "p1");

        Assert.Equal(TurnPhaseDto.Fortify, updated.TurnState!.TurnPhase);
    }

    [Fact]
    public async Task EndPhase_VanuitAanvallenMetLopendGevecht_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory, TurnPhase.Attack, albertaOwnerId: "p2", albertaArmies: 1,
            pendingCombat: new PendingCombat("alaska", "alberta", AttackDice: 2, CorrelationId: Guid.NewGuid()));

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("EndPhase", gameId, "p1"));

        Assert.Contains("turnFlow.combatInProgress", exception.Message);
    }

    [Fact]
    public async Task EndPhase_VanuitVerplaatsen_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Fortify, albertaOwnerId: "p2", albertaArmies: 1);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("EndPhase", gameId, "p1"));

        Assert.Contains("turnFlow.useEndTurnInFortify", exception.Message);
    }

    [Fact]
    public async Task EndTurn_VanuitVerplaatsen_SchuiftDoorNaarVolgendeSpelerVersterken()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Fortify, albertaOwnerId: "p2", albertaArmies: 1);

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        Assert.Equal("p2", updated.TurnState!.ActivePlayerId);
        Assert.Equal(TurnPhaseDto.Reinforce, updated.TurnState.TurnPhase);
    }

    /// <summary>
    /// De versterkingen op de nieuwe beurt horen bij de speler die aan zet kómt, niet bij die
    /// vertrekt. Dat onderscheid is stil te verprutsen: <c>TurnEnded</c> heeft bewust geen
    /// vouwregel, dus op het moment van berekenen staat de uitgaande speler nog als actief in
    /// de state. Daarom bezitten de twee spelers hier bewust een óngelijk aantal gebieden —
    /// p2 heeft heel Australië (5 gebieden + continentbonus 3 = 6), p1 twee losse gebieden
    /// (minimum 3). Bij een gelijke verdeling zouden beide 3 opleveren en zou de verkeerde
    /// speler dezelfde uitkomst geven: de test zou dan groen blijven op een bug.
    /// </summary>
    [Fact]
    public async Task EndTurn_KentDeVersterkingenVanDeInkomendeSpelerToe()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory,
            TurnPhase.Fortify,
            albertaOwnerId: "p1",
            albertaArmies: 1,
            extraTerritoriesForP2:
                ["indonesia", "new-guinea", "western-australia", "eastern-australia", "new-zealand"]);

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        Assert.Equal("p2", updated.TurnState!.ActivePlayerId);
        Assert.Equal(6, updated.TurnState.ArmiesRemaining);
    }

    /// <summary>
    /// Een fase-overgang binnen de beurt kent niets toe: <c>ArmiesRemaining</c> hoort op 0 te
    /// staan en niet op de pool van de vorige fase (FO §5.2).
    /// </summary>
    [Fact]
    public async Task EndPhase_KentGeenVersterkingenToe()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Reinforce, albertaOwnerId: "p2", albertaArmies: 1);

        var updated = await connection.InvokeAsync<GameStateDto>("EndPhase", gameId, "p1");

        Assert.Equal(TurnPhaseDto.Attack, updated.TurnState!.TurnPhase);
        Assert.Equal(0, updated.TurnState.ArmiesRemaining);
    }

    /// <summary>
    /// FO §6.1/§6.2: "de server controleert de missievoorwaarden na elke beurt" — een
    /// onomkeerbare missie (<c>EliminatePlayer</c>, <c>RequiresLastChance = false</c>) die al
    /// vervuld is op het moment dat de houder zijn beurt beëindigt, moet het spel meteen
    /// afsluiten i.p.v. gewoon door te schuiven naar de volgende speler — ongeacht
    /// <see cref="GameSettings.MissionWinTiming"/>. (Een bezit-missie zoals <c>territory-24</c>
    /// doet dat sinds FO §6.2 alleen nog direct onder <see cref="MissionWinTiming.EndOfTurn"/>
    /// — de standaardwaarde die <see cref="SettingsDto"/> hier ongewijzigd gebruikt — dekking
    /// voor de laatste-kans-varianten staat in <c>GameHubLastChanceTests</c>.)
    /// </summary>
    [Fact]
    public async Task EndTurn_MetVervuldeDirecteMissie_BeeindigtHetSpel()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);
        await using var spectator = await ConnectAsync(factory, client);

        // "eliminate-blue" (echte missie uit missions.json — missies komen altijd uit de
        // kaartcatalogus, zie SetUpStateAsync's doc-comment) is vervuld zodra Bob (blauw) is
        // uitgeschakeld dóór Alice zelf (FO §6.1) — onomkeerbaar, dus geen laatste-kans-venster.
        var gameId = await SetUpStateAsync(
            factory, TurnPhase.Fortify, albertaOwnerId: "p1", albertaArmies: 1,
            aliceMissionId: "eliminate-blue", bobIsEliminated: true, bobEliminatedByPlayerId: "p1");

        await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);
        var gameWonReceived = new TaskCompletionSource<GameWonMessage>();
        spectator.On<GameWonMessage>("GameWon", message => gameWonReceived.TrySetResult(message));

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        Assert.Equal(GamePhaseDto.Finished, updated.Phase);
        Assert.Equal(["p1"], updated.Winners);
        // Geen doorschuif naar p2 — TurnEnded's PhaseChanged-naar-Reinforce wordt overgeslagen
        // zodra er een winnaar is. GameProjection.Apply(state, GameWon) wist TurnState ook
        // expliciet (incl. een eventuele PendingCombat, bevinding gebruiker 2026-08-18: anders
        // blijft de combat-/eliminatie-overlay boven TvGameOverScreen hangen) — dus "geen
        // doorschuif" toont zich hier als TurnState == null, niet als ActivePlayerId == "p1".
        Assert.Null(updated.TurnState);

        var gameWon = await gameWonReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal(["p1"], gameWon.WinnerPlayerIds);
    }

    [Fact]
    public async Task EndTurn_NietVanuitVerplaatsen_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(factory, TurnPhase.Attack, albertaOwnerId: "p2", albertaArmies: 1);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1"));

        Assert.Contains("common.wrongTurnPhase", exception.Message);
    }

    /// <summary>
    /// FO §5.2: een beurt met minstens één verovering trekt aan het einde 1 kaart van de
    /// bovenkant van de (al geschudde) trekstapel — nogmaals dobbelen is niet nodig, dus
    /// <see cref="SequenceRandomSource"/> hoeft hier geen waarden te bevatten.
    /// </summary>
    [Fact]
    public async Task EndTurn_MetVeroverdGebiedDezeBeurt_TrektEenKaartVanDeTrekstapel()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory, TurnPhase.Fortify, albertaOwnerId: "p2", albertaArmies: 1,
            hasConqueredThisTurn: true, drawPileCardIds: ["card-japan", "card-china"]);

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        var alice = updated.Players.Single(player => player.Id == "p1");
        Assert.Equal(["card-japan"], alice.Hand.Select(card => card.Id));
    }

    [Fact]
    public async Task EndTurn_ZonderVeroverdGebiedDezeBeurt_TrektGeenKaart()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory, TurnPhase.Fortify, albertaOwnerId: "p2", albertaArmies: 1,
            hasConqueredThisTurn: false, drawPileCardIds: ["card-japan", "card-china"]);

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        var alice = updated.Players.Single(player => player.Id == "p1");
        Assert.Empty(alice.Hand);
    }

    /// <summary>
    /// FO §4.4: raakt de trekstapel leeg tijdens het spel, dan wordt de aflegstapel
    /// hertschud tot de nieuwe trekstapel — ook wanneer dat nodig is om de kaart van een
    /// veroverende beurt te kunnen trekken.
    /// </summary>
    [Fact]
    public async Task EndTurn_MetLegeTrekstapelEnGevuldeAflegstapel_HerschudtEnTrektDeBovensteKaart()
    {
        // PickRandomSubset over 2 kaarten: i=0 -> Next(0,2)=0 (geen swap), i=1 -> Next(1,2)=1
        // (enige geldige waarde in dat bereik) — levert de aflegstapel dus terug in dezelfde
        // volgorde, zodat "card-japan" boven komt te liggen.
        var random = new SequenceRandomSource([0, 1]);
        await using var factory = CreateFactory(random);
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory, TurnPhase.Fortify, albertaOwnerId: "p2", albertaArmies: 1,
            hasConqueredThisTurn: true, discardPileCardIds: ["card-japan", "card-china"]);

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        var alice = updated.Players.Single(player => player.Id == "p1");
        Assert.Equal(["card-japan"], alice.Hand.Select(card => card.Id));
    }

    /// <summary>
    /// Anders dan <see cref="TurnState.HasFortified"/> moet <c>HasConqueredThisTurn</c> een
    /// fase-overgang binnen dezelfde beurt overleven (Aanvallen → Verplaatsen). Bewezen
    /// indirect via het kaarttrekken: zou de vlag onderweg resetten, dan zou de latere
    /// <c>EndTurn</c> niets trekken.
    /// </summary>
    [Fact]
    public async Task HasConqueredThisTurn_OverleeftFaseovergangNaarVerplaatsen()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory, TurnPhase.Attack, albertaOwnerId: "p2", albertaArmies: 1,
            hasConqueredThisTurn: true, drawPileCardIds: ["card-japan"]);

        await connection.InvokeAsync<GameStateDto>("EndPhase", gameId, "p1");
        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        var alice = updated.Players.Single(player => player.Id == "p1");
        Assert.Equal(["card-japan"], alice.Hand.Select(card => card.Id));
    }

    /// <summary>
    /// Beide stapels leeg terwijl niet alle kaarten in een hand zitten kan alleen een bug
    /// zijn (bv. een spelstream zonder <c>DeckShuffled</c>) — geen stille no-op (src/CLAUDE.md).
    /// </summary>
    [Fact]
    public async Task EndTurn_MetVeroveringEnBeideStapelsOnverwachtLeeg_GooitEenFout()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory, TurnPhase.Fortify, albertaOwnerId: "p2", albertaArmies: 1,
            hasConqueredThisTurn: true);

        await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1"));
    }
}
