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
/// Bewijst FO §6.2 (laatste-kans-venster rond bezit-missies) end-to-end, los van
/// <see cref="GameHubTurnFlowTests"/>: dat bestand blijft bij zijn bestaande 2-spelers-
/// <c>SetUpStateAsync</c> (die dekt het directe pad, zie
/// <see cref="GameHubTurnFlowTests.EndTurn_MetVervuldeDirecteMissie_BeeindigtHetSpel"/>), dit
/// bestand heeft een eigen 3-spelershelper nodig om "venster versmalt" versus "venster
/// resolveert" zinvol te kunnen tonen. Elke test zaait zijn eigen, in isolatie begrijpelijke
/// <see cref="GameState"/> (indien nodig al met een openstaand <see cref="PendingWin"/>) en
/// doet precies één <c>EndTurn</c>-aanroep — bewust geen meerstaps-hertoewijzing van dezelfde
/// Marten-state binnen één test, om niet te hoeven vertrouwen op hoe Marten's event-versionering
/// zich verhoudt tot een herhaalde <c>session.Store</c> op hetzelfde document.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubLastChanceTests(PostgresFixture postgres)
{
    private WebApplicationFactory<Program> CreateFactory() =>
        ApiTestHost.Create(
            postgres, services => services.AddSingleton<IRandomSource>(new SequenceRandomSource()));

    private static Task<HubConnection> ConnectAsync(WebApplicationFactory<Program> factory, HttpClient client) =>
        ApiTestHost.ConnectAsync(factory, client);

    /// <summary>
    /// Bouwt een spel met drie spelers rechtstreeks op in <see cref="TurnPhase.Fortify"/> voor
    /// <paramref name="activePlayerId"/>, met <paramref name="pendingWin"/> als het startpunt al
    /// een openstaand laatste-kans-venster heeft (FO §6.2). <paramref name="achieverTerritoryCount"/>
    /// bepaalt hoeveel van de 43 gebieden op "territory-24" (eist 24 gebieden) aan
    /// <c>achieverPlayerId</c> toegekend worden — 24+ laat de missie gelden, minder laat hem
    /// (opnieuw) niet gelden, wat "heroverd gebied" simuleert.
    /// </summary>
    private static async Task<string> SetUpStateAsync(
        WebApplicationFactory<Program> factory,
        string activePlayerId,
        MissionWinTiming missionWinTiming,
        string achieverPlayerId,
        int achieverTerritoryCount,
        PendingWin? pendingWin = null,
        string? achieverMissionId = "territory-24",
        IReadOnlyDictionary<string, (string TargetColor, string EliminatedColorId)>? eliminatePlayerMissionsByPlayer = null,
        IReadOnlyList<string>? eliminatedPlayerIds = null)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var mapSource = factory.Services.GetRequiredService<IMapDefinitionSource>();
        var map = mapSource.Load("standaard-43");

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            StartingArmiesPresetId: "classic",
            TurnTimer: TimeSpan.FromMinutes(3),
            FortifyTimer: TimeSpan.FromMinutes(1),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false,
            MissionWinTiming: missionWinTiming);

        var eliminated = eliminatedPlayerIds ?? [];
        var eliminateMissions = eliminatePlayerMissionsByPlayer
            ?? new Dictionary<string, (string, string)>();

        IMission? MissionFor(string playerId)
        {
            if (playerId == achieverPlayerId && achieverMissionId is not null)
            {
                return map.Missions.Single(mission => mission.Id == achieverMissionId);
            }

            if (eliminateMissions.TryGetValue(playerId, out var target))
            {
                return new EliminatePlayerMission(
                    $"eliminate-{target.TargetColor}", "Naam", "Beschrijving", RequiresOwnTurn: false,
                    TargetColor: target.TargetColor);
            }

            return null;
        }

        var players = new[]
        {
            new Player(
                "p1", "Alice", "red", Hand: [], RoleId: null, Mission: MissionFor("p1"),
                IsEliminated: eliminated.Contains("p1")),
            new Player(
                "p2", "Bob", "blue", Hand: [], RoleId: null, Mission: MissionFor("p2"),
                IsEliminated: eliminated.Contains("p2")),
            new Player(
                "p3", "Carol", "yellow", Hand: [], RoleId: null, Mission: MissionFor("p3"),
                IsEliminated: eliminated.Contains("p3")),
        };

        foreach (var (playerId, target) in eliminateMissions)
        {
            var eliminatedPlayer = players.Single(p => p.ColorId == target.EliminatedColorId);
            var index = Array.IndexOf(players, eliminatedPlayer);
            players[index] = eliminatedPlayer with { IsEliminated = true, EliminatedByPlayerId = playerId };
        }

        var achieverTerritoryIds = map.Territories.Take(achieverTerritoryCount).Select(t => t.Id).ToHashSet();

        var territories = map.Territories
            .Select(territory => achieverTerritoryIds.Contains(territory.Id)
                ? new TerritoryOwnership(territory.Id, achieverPlayerId, ArmyCount: 1)
                : new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0))
            .ToArray();

        var state = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            settings,
            players: players,
            territories,
            turnOrder: ["p1", "p2", "p3"],
            turnState: new TurnState(
                activePlayerId, TurnPhase.Fortify, new PhaseTimer(settings.TurnTimer, DateTimeOffset.UtcNow),
                PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: [],
            pendingWin: pendingWin);

        var store = factory.Services.GetRequiredService<IDocumentStore>();

        await using var session = store.LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    /// <summary>
    /// <see cref="PendingWin.RemainingPlayerIds"/> is een <c>IReadOnlyList&lt;string&gt;</c> —
    /// de record-gegenereerde <c>Equals</c> vergelijkt zo'n lijst via <c>object.Equals</c>
    /// (referentie), niet inhoudelijk (zelfde valkuil als <c>Player.Hand</c>, zie
    /// <c>GameProjectionRoundTripTests</c>). Daarom hier per veld vergelijken.
    /// </summary>
    private static void AssertPendingWinEqual(PendingWin? expected, PendingWin? actual)
    {
        if (expected is null)
        {
            Assert.Null(actual);
            return;
        }

        Assert.NotNull(actual);
        Assert.Equal(expected.AchieverPlayerId, actual!.AchieverPlayerId);
        Assert.Equal(expected.MissionId, actual.MissionId);
        Assert.Equal(expected.RemainingPlayerIds, actual.RemainingPlayerIds);
    }

    [Fact]
    public async Task EndTurn_MetVervuldeLaatsteKansMissie_OpentEenVensterEnBeeindigtHetSpelNietMeteen()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory, activePlayerId: "p1", MissionWinTiming.StartOfNextTurn,
            achieverPlayerId: "p1", achieverTerritoryCount: 24);

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        Assert.Equal(GamePhaseDto.InProgress, updated.Phase);
        Assert.Empty(updated.Winners);
        Assert.Equal("p2", updated.TurnState!.ActivePlayerId);
        // StartOfNextTurn onthult niets — zie de FullRoundRevealed-tegenhanger hieronder.
        Assert.Null(updated.PendingWinnerPlayerId);

        var store = factory.Services.GetRequiredService<IDocumentStore>();
        await using var session = store.LightweightSession();
        var raw = await session.LoadAsync<GameState>(gameId);

        AssertPendingWinEqual(new PendingWin("p1", "territory-24", ["p2", "p3"]), raw!.PendingWin);
    }

    [Fact]
    public async Task EndTurn_MetVervuldeLaatsteKansMissieOnderFullRoundRevealed_OnthultDeNaamVanDeMogelijkeWinnaar()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);
        await using var spectator = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory, activePlayerId: "p1", MissionWinTiming.FullRoundRevealed,
            achieverPlayerId: "p1", achieverTerritoryCount: 24);

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");

        Assert.Equal(GamePhaseDto.InProgress, updated.Phase);
        Assert.Equal("p1", updated.PendingWinnerPlayerId);

        // De missie-inhoud blijft geheim (FO §2/§6.2): geen enkele MissionId lekt naar de
        // TV-groep, ook al is de naam van de mogelijke winnaar daar nu wel zichtbaar.
        var tvView = await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.Equal("p1", tvView.PendingWinnerPlayerId);
        Assert.All(tvView.Players, player => Assert.Null(player.MissionId));
    }

    [Fact]
    public async Task EndTurn_TijdensLaatsteKansMetNogVervuldeMissie_VersmaltHetVenster()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory, activePlayerId: "p2", MissionWinTiming.StartOfNextTurn,
            achieverPlayerId: "p1", achieverTerritoryCount: 24,
            pendingWin: new PendingWin("p1", "territory-24", ["p2", "p3"]));

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2");

        Assert.Equal(GamePhaseDto.InProgress, updated.Phase);
        Assert.Empty(updated.Winners);

        var store = factory.Services.GetRequiredService<IDocumentStore>();
        await using var session = store.LightweightSession();
        var raw = await session.LoadAsync<GameState>(gameId);

        AssertPendingWinEqual(new PendingWin("p1", "territory-24", ["p3"]), raw!.PendingWin);
    }

    [Fact]
    public async Task EndTurn_NaLaatsteKansVanAlleTegenstandersMetNogVervuldeMissie_BeeindigtHetSpel()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);
        await using var spectator = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory, activePlayerId: "p3", MissionWinTiming.StartOfNextTurn,
            achieverPlayerId: "p1", achieverTerritoryCount: 24,
            pendingWin: new PendingWin("p1", "territory-24", ["p3"]));

        await spectator.InvokeAsync<GameStateDto>("WatchGame", gameId);
        var gameWonReceived = new TaskCompletionSource<GameWonMessage>();
        spectator.On<GameWonMessage>("GameWon", message => gameWonReceived.TrySetResult(message));

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p3");

        Assert.Equal(GamePhaseDto.Finished, updated.Phase);
        Assert.Equal(["p1"], updated.Winners);

        var gameWon = await gameWonReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal(["p1"], gameWon.WinnerPlayerIds);
    }

    [Fact]
    public async Task EndTurn_TijdensLaatsteKansMetHeroverdGebied_AnnuleertDePendingWinnaar()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        var gameId = await SetUpStateAsync(
            factory, activePlayerId: "p2", MissionWinTiming.StartOfNextTurn,
            achieverPlayerId: "p1", achieverTerritoryCount: 5, // < 24: p2 heeft genoeg heroverd
            pendingWin: new PendingWin("p1", "territory-24", ["p2", "p3"]));

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2");

        Assert.Equal(GamePhaseDto.InProgress, updated.Phase);
        Assert.Empty(updated.Winners);

        var store = factory.Services.GetRequiredService<IDocumentStore>();
        await using var session = store.LightweightSession();
        var raw = await session.LoadAsync<GameState>(gameId);

        Assert.Null(raw!.PendingWin);
    }

    [Fact]
    public async Task EndTurn_TijdensLaatsteKansVensterMetDirecteWinconditieVanAnderSpeler_WintMeteen()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);

        // p1's laatste-kans-venster loopt (territory-24), maar p2 vervult tijdens zijn eigen
        // laatste-kans-beurt een onomkeerbare EliminatePlayer-missie (doelwit Carol/p3, al
        // uitgeschakeld dóór p2) — die wint meteen, ongeacht het lopende venster (FO §6.2).
        var gameId = await SetUpStateAsync(
            factory, activePlayerId: "p2", MissionWinTiming.StartOfNextTurn,
            achieverPlayerId: "p1", achieverTerritoryCount: 24,
            pendingWin: new PendingWin("p1", "territory-24", ["p2", "p3"]),
            eliminatePlayerMissionsByPlayer: new Dictionary<string, (string, string)>
            {
                ["p2"] = ("yellow", "yellow"),
            });

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p2");

        Assert.Equal(GamePhaseDto.Finished, updated.Phase);
        Assert.Equal(["p2"], updated.Winners);

        var store = factory.Services.GetRequiredService<IDocumentStore>();
        await using var session = store.LightweightSession();
        var raw = await session.LoadAsync<GameState>(gameId);

        Assert.Null(raw!.PendingWin);
    }
}
