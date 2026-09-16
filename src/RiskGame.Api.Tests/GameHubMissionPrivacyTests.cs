using System.Net.Http.Json;
using Marten;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Map;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst de privacy-grens uit TO §6.1: <see cref="PlayerDto.MissionId"/> gaat uitsluitend
/// naar de eigen speler-groep, nooit naar de tv-groep of een andere speler. <c>RejoinGame</c>
/// vormt daarop geen achterdeur: alleen de connectie die het juiste sessietoken (TO §6.3,
/// uitgegeven bij <c>JoinGame</c>) meestuurt krijgt de eigen Hand/Mission terug — een
/// connectie die enkel het publieke <c>playerId</c> kent (zoals elke andere speler dat al
/// kent via <see cref="GameStateDto.Players"/>) krijgt nog altijd de publieke weergave, zie
/// <see cref="RejoinGame_MetBekendePubliekeId_GeeftNooitDeMissionIdVanDieSpelerTerug"/>.
/// <see cref="PlayerDto.Hand"/> blijft in deze tests bewust ongetest: kaart-trekken-bij-
/// verovering is nog niet gebouwd, dus die lijst is vandaag voor iedereen leeg — een assert
/// daarop zou niets over de privacy-grens bewijzen.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubMissionPrivacyTests(PostgresFixture postgres)
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

    private WebApplicationFactory<Program> CreateFactory() => ApiTestHost.Create(postgres);

    private static async Task<string> CreateGameAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync(
            "/games", new CreateGameRequest("standaard-43", Settings));
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<CreateGameResponse>();

        return body!.GameId;
    }

    private static Task<HubConnection> ConnectAsync(WebApplicationFactory<Program> factory, HttpClient client) =>
        ApiTestHost.ConnectAsync(factory, client);

    private static async Task<string> JoinAndChooseColorAsync(
        HubConnection connection, string gameId, string playerName, string colorId)
    {
        var joined = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, playerName);
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, joined.PlayerId, colorId);

        return joined.PlayerId;
    }

    [Fact]
    public async Task StartGame_MetGeheimeMissies_TvKrijgtNooitEenMissionId()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client);

        await using var aliceConnection = await ConnectAsync(factory, client);
        var aliceId = await JoinAndChooseColorAsync(aliceConnection, gameId, "Alice", "red");

        await using var bobConnection = await ConnectAsync(factory, client);
        await JoinAndChooseColorAsync(bobConnection, gameId, "Bob", "blue");

        await using var tv = await ConnectAsync(factory, client);
        var received = new TaskCompletionSource<GameStateDto>();
        tv.On<GameStateDto>("GameStateUpdated", state => received.TrySetResult(state));
        await tv.InvokeAsync<GameStateDto>("WatchGame", gameId);

        await aliceConnection.InvokeAsync<GameStateDto>("StartGame", gameId, aliceId);

        var pushed = await received.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.All(pushed.Players, player => Assert.Null(player.MissionId));
    }

    [Fact]
    public async Task StartGame_MetGeheimeMissies_SpelerZietAlleenDeEigenMissionId()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client);

        await using var aliceConnection = await ConnectAsync(factory, client);
        var aliceId = await JoinAndChooseColorAsync(aliceConnection, gameId, "Alice", "red");

        await using var bobConnection = await ConnectAsync(factory, client);
        var bobId = await JoinAndChooseColorAsync(bobConnection, gameId, "Bob", "blue");

        var bobReceived = new TaskCompletionSource<GameStateDto>();
        bobConnection.On<GameStateDto>("GameStateUpdated", state => bobReceived.TrySetResult(state));

        var aliceState = await aliceConnection.InvokeAsync<GameStateDto>("StartGame", gameId, aliceId);

        Assert.NotNull(aliceState.Players.Single(player => player.Id == aliceId).MissionId);
        Assert.Null(aliceState.Players.Single(player => player.Id == bobId).MissionId);

        var bobPushed = await bobReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.NotNull(bobPushed.Players.Single(player => player.Id == bobId).MissionId);
        Assert.Null(bobPushed.Players.Single(player => player.Id == aliceId).MissionId);
    }

    /// <summary>
    /// De echte telefoon-volgorde (useGameState): eerst <c>WatchGame</c> voor het kleurenpalet op
    /// de join-stap, dán <c>JoinGame</c> op dezelfde connectie. Zonder het verlaten van de
    /// tv-groep in <c>JoinGame</c> ontving die connectie elke broadcast tweemaal — de
    /// tv-geredacte versie als eerste — en verloor de client zo de eigen MissionId.
    /// </summary>
    [Fact]
    public async Task JoinGame_NaWatchGameOpDezelfdeConnectie_EerstePushBevatDeEigenMissionId()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client);

        await using var aliceConnection = await ConnectAsync(factory, client);
        var aliceId = await JoinAndChooseColorAsync(aliceConnection, gameId, "Alice", "red");

        await using var bobConnection = await ConnectAsync(factory, client);
        await bobConnection.InvokeAsync<GameStateDto>("WatchGame", gameId);
        var bobId = await JoinAndChooseColorAsync(bobConnection, gameId, "Bob", "blue");

        var bobReceived = new TaskCompletionSource<GameStateDto>();
        bobConnection.On<GameStateDto>("GameStateUpdated", state => bobReceived.TrySetResult(state));

        await aliceConnection.InvokeAsync<GameStateDto>("StartGame", gameId, aliceId);

        var bobPushed = await bobReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.NotNull(bobPushed.Players.Single(player => player.Id == bobId).MissionId);
    }

    [Fact]
    public async Task RejoinGame_MetBekendePubliekeIdMaarZonderToken_GeeftNooitDeMissionIdVanDieSpelerTerug()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client);

        await using var aliceConnection = await ConnectAsync(factory, client);
        var aliceId = await JoinAndChooseColorAsync(aliceConnection, gameId, "Alice", "red");

        await using var bobConnection = await ConnectAsync(factory, client);
        await JoinAndChooseColorAsync(bobConnection, gameId, "Bob", "blue");

        var aliceState = await aliceConnection.InvokeAsync<GameStateDto>("StartGame", gameId, aliceId);
        Assert.NotNull(aliceState.Players.Single(player => player.Id == aliceId).MissionId);

        // Een willekeurige derde verbinding kent Alice's playerId alleen omdat die publiek in
        // Players[] staat — zonder haar sessietoken (TO §6.3) is dat geen bewijs dat dit
        // Alice's eigen apparaat is, dus geen "" doorgeven bewijst hier expliciet dat een kaal
        // playerId alleen niet volstaat.
        await using var otherConnection = await ConnectAsync(factory, client);
        var rejoined = await otherConnection.InvokeAsync<GameStateDto>("RejoinGame", gameId, aliceId, "");

        Assert.Null(rejoined.Players.Single(player => player.Id == aliceId).MissionId);
    }

    [Fact]
    public async Task RejoinGame_MetEigenSessionToken_GeeftDeEigenMissionIdWeerTerug()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client);

        // Niet via JoinAndChooseColorAsync: die geeft alleen PlayerId terug, het SessionToken
        // zou daarmee verloren gaan. Zelf JoinGame + ChooseColor aanroepen om het vast te houden.
        await using var aliceConnection = await ConnectAsync(factory, client);
        var joined = await aliceConnection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        await aliceConnection.InvokeAsync<GameStateDto>("ChooseColor", gameId, joined.PlayerId, "red");

        await using var bobConnection = await ConnectAsync(factory, client);
        await JoinAndChooseColorAsync(bobConnection, gameId, "Bob", "blue");

        await aliceConnection.InvokeAsync<GameStateDto>("StartGame", gameId, joined.PlayerId);

        // Nieuwe connectie (page-reload/reconnect), maar mét het echte token uit JoinGame.
        await using var reconnected = await ConnectAsync(factory, client);
        var rejoined = await reconnected.InvokeAsync<GameStateDto>(
            "RejoinGame", gameId, joined.PlayerId, joined.SessionToken);

        Assert.NotNull(rejoined.Players.Single(player => player.Id == joined.PlayerId).MissionId);
    }

    /// <summary>
    /// Bouwt een spel rechtstreeks op in de projectie-fase Fortify, met Alice (p1) eigenaar
    /// van vrijwel de hele kaart (42 van de 43 gebieden — "territory-24" eist er 24) en Bob
    /// (p2) alleen "alberta" — zelfde opzet als <c>GameHubTurnFlowTests.SetUpStateAsync</c>,
    /// hier lokaal herhaald (geen gedeelde helper tussen testklassen, zelfde patroon als
    /// <c>GameHubAttackTests</c>/<c>GameHubTurnFlowTests</c> onderling).
    /// </summary>
    private static async Task<string> SetUpFinishedGameStateAsync(WebApplicationFactory<Program> factory)
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

        var aliceMission = map.Missions.Single(mission => mission.Id == "territory-24");

        var alice = new Player(
            "p1", "Alice", "red", Hand: [], RoleId: null, Mission: aliceMission, IsEliminated: false);
        var bob = new Player(
            "p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false);

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "alberta" => new TerritoryOwnership(territory.Id, "p2", ArmyCount: 1),
                _ => new TerritoryOwnership(territory.Id, "p1", ArmyCount: 1),
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
                "p1", TurnPhase.Fortify, new PhaseTimer(settings.TurnTimer, DateTimeOffset.UtcNow), PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        var store = factory.Services.GetRequiredService<IDocumentStore>();

        await using var session = store.LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    [Fact]
    public async Task EndTurn_MetVervuldeMissie_TvKrijgtAlleMissionIdsPasBijAfloop()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ConnectAsync(factory, client);
        await using var tv = await ConnectAsync(factory, client);

        var gameId = await SetUpFinishedGameStateAsync(factory);

        var received = new TaskCompletionSource<GameStateDto>();
        tv.On<GameStateDto>("GameStateUpdated", state => received.TrySetResult(state));
        var watched = await tv.InvokeAsync<GameStateDto>("WatchGame", gameId);

        // Vóór het spel afloopt: de TV kent Alice se missie nog niet, ook al bestaat de missie
        // allang (server-side, sinds StartGame) — zelfde regel als StartGame_MetGeheimeMissies_
        // TvKrijgtNooitEenMissionId, hier nogmaals bevestigd op een spel dat al InProgress is.
        Assert.All(watched.Players, player => Assert.Null(player.MissionId));

        var updated = await connection.InvokeAsync<GameStateDto>("EndTurn", gameId, "p1");
        Assert.Equal(GamePhaseDto.Finished, updated.Phase);

        var pushed = await received.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.Equal(GamePhaseDto.Finished, pushed.Phase);
        Assert.Equal("territory-24", pushed.Players.Single(player => player.Id == "p1").MissionId);
        // Bob had geen missie (WinCondition.SecretMissions gold, maar hij kreeg er in deze
        // directe seed bewust geen — zie SetUpFinishedGameStateAsync) — moet null blijven,
        // niet per ongeluk iets anders opleveren.
        Assert.Null(pushed.Players.Single(player => player.Id == "p2").MissionId);
    }

    [Fact]
    public async Task RemovePlayer_Verwijderde_KrijgtNogEenLaatsteUpdateOpDeEigenGroep()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var gameId = await CreateGameAsync(client);

        await using var hostConnection = await ConnectAsync(factory, client);
        var hostId = await JoinAndChooseColorAsync(hostConnection, gameId, "Alice", "red");

        await using var bobConnection = await ConnectAsync(factory, client);
        var bobId = await JoinAndChooseColorAsync(bobConnection, gameId, "Bob", "blue");

        var bobReceived = new TaskCompletionSource<GameStateDto>();
        bobConnection.On<GameStateDto>("GameStateUpdated", state => bobReceived.TrySetResult(state));

        await hostConnection.InvokeAsync<GameStateDto>("RemovePlayer", gameId, hostId, bobId);

        var pushed = await bobReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.DoesNotContain(pushed.Players, player => player.Id == bobId);
    }
}
