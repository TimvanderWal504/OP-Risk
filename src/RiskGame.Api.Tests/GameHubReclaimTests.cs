using Marten;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;
using RiskGame.Api.Services;
using RiskGame.Persistence.Map;
using RiskGame.Persistence.Sessions;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Map;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// Een speler neemt zijn positie over op een ander tabblad of apparaat (TO §6.3, <c>RejoinAsPlayer</c>):
/// met alleen de spelcode en zijn naam, waarna het oude token ongeldig is en de eerdere connecties van
/// die speler zijn player-groep en presence kwijt zijn.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubReclaimTests(PostgresFixture postgres)
{
    private const string BobsOldToken = "oud-token-van-bob";

    private static readonly Card BobsCard = new("c1", "alaska", "infantry");

    private WebApplicationFactory<Program> CreateFactory() =>
        ApiTestHost.Create(postgres, services => services.AddSingleton<IRandomSource>(new SequenceRandomSource()));

    /// <summary>
    /// Een lopend spel: Alice (p1, host) aan de beurt, Bob (p2) met een kaart in de hand en een sessietoken.
    /// <paramref name="extraPlayerNamedBob"/> voegt een tweede speler toe met dezelfde naam in andere hoofdletters.
    /// </summary>
    private static async Task<string> SetUpAsync(
        WebApplicationFactory<Program> factory, bool bobIsAutoPass = false, bool extraPlayerNamedBob = false)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var map = factory.Services.GetRequiredService<IMapDefinitionSource>().Load("standaard-43");

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            StartingArmiesPresetId: "classic",
            TurnTimer: TimeSpan.FromMinutes(3),
            FortifyTimer: TimeSpan.FromMinutes(1),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false);

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "alaska" => new TerritoryOwnership(territory.Id, "p1", 3),
                "alberta" => new TerritoryOwnership(territory.Id, "p2", 3),
                _ => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0),
            })
            .ToArray();

        var players = new List<Player>
        {
            new("p1", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false, IsHost: true),
            new("p2", "Bob", "blue", Hand: [BobsCard], RoleId: null, Mission: null, IsEliminated: false, IsAutoPass: bobIsAutoPass),
        };

        if (extraPlayerNamedBob)
        {
            players.Add(new Player("p3", "BOB", "green", Hand: [], RoleId: null, Mission: null, IsEliminated: false));
        }

        var state = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            settings,
            players,
            territories,
            turnOrder: [.. players.Select(player => player.Id)],
            turnState: new TurnState("p1", TurnPhase.Reinforce, new PhaseTimer(settings.TurnTimer, DateTimeOffset.UtcNow), PendingCombat: null),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        await using var session = factory.Services.GetRequiredService<IDocumentStore>().LightweightSession();
        session.Store(state);
        session.Store(new PlayerSessionToken("p2", gameId, BobsOldToken));
        await session.SaveChangesAsync();

        return gameId;
    }

    private static async Task<GameState> LoadAsync(WebApplicationFactory<Program> factory, string gameId)
    {
        await using var session = factory.Services.GetRequiredService<IDocumentStore>().QuerySession();

        return (await session.LoadAsync<GameState>(gameId))!;
    }

    private static async Task<string> StoredTokenAsync(WebApplicationFactory<Program> factory, string playerId)
    {
        await using var session = factory.Services.GetRequiredService<IDocumentStore>().QuerySession();

        return (await session.LoadAsync<PlayerSessionToken>(playerId))!.Token;
    }

    private static PlayerDto PlayerOf(GameStateDto state, string playerId) => state.Players.Single(player => player.Id == playerId);

    [Fact]
    public async Task RejoinAsPlayer_MetBestaandeNaam_GeeftEenNieuwTokenEnDeEigenHand()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var newTab = await ApiTestHost.ConnectAsync(factory, client);
        var gameId = await SetUpAsync(factory);

        var response = await newTab.InvokeAsync<JoinGameResponse>("RejoinAsPlayer", gameId, "Bob");

        Assert.Equal("p2", response.PlayerId);
        Assert.NotEqual(BobsOldToken, response.SessionToken);
        Assert.Equal(response.SessionToken, await StoredTokenAsync(factory, "p2"));
        Assert.Single(PlayerOf(response.State, "p2").Hand);
    }

    [Fact]
    public async Task RejoinAsPlayer_ToontDeHandVanAnderenNiet()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var newTab = await ApiTestHost.ConnectAsync(factory, client);
        var gameId = await SetUpAsync(factory);

        var response = await newTab.InvokeAsync<JoinGameResponse>("RejoinAsPlayer", gameId, "Alice");

        Assert.Empty(PlayerOf(response.State, "p2").Hand);
    }

    [Fact]
    public async Task RejoinAsPlayer_NaamMetSpatiesEnAndereHoofdletters_Matcht()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var newTab = await ApiTestHost.ConnectAsync(factory, client);
        var gameId = await SetUpAsync(factory);

        var response = await newTab.InvokeAsync<JoinGameResponse>("RejoinAsPlayer", gameId, "  bOb ");

        Assert.Equal("p2", response.PlayerId);
    }

    [Fact]
    public async Task RejoinAsPlayer_OnbekendeNaam_IsEenFoutEnLaatHetTokenStaan()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var newTab = await ApiTestHost.ConnectAsync(factory, client);
        var gameId = await SetUpAsync(factory);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            newTab.InvokeAsync<JoinGameResponse>("RejoinAsPlayer", gameId, "Niemand"));

        Assert.Contains("common.unknownPlayerName", exception.Message);
        Assert.Equal(BobsOldToken, await StoredTokenAsync(factory, "p2"));
    }

    [Fact]
    public async Task RejoinAsPlayer_OnbekendSpel_IsEenFout()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var newTab = await ApiTestHost.ConnectAsync(factory, client);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            newTab.InvokeAsync<JoinGameResponse>("RejoinAsPlayer", "bestaat-niet", "Bob"));

        Assert.Contains("common.unknownGame", exception.Message);
    }

    /// <summary>Namen zijn niet uniek in de lobby: een naam die twee spelers aanwijst, wordt geweigerd i.p.v. geraden.</summary>
    [Fact]
    public async Task RejoinAsPlayer_NaamVanMeerDanEenSpeler_IsEenFoutEnLaatHetTokenStaan()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var newTab = await ApiTestHost.ConnectAsync(factory, client);
        var gameId = await SetUpAsync(factory, extraPlayerNamedBob: true);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            newTab.InvokeAsync<JoinGameResponse>("RejoinAsPlayer", gameId, "Bob"));

        Assert.Contains("common.ambiguousPlayerName", exception.Message);
        Assert.Equal(BobsOldToken, await StoredTokenAsync(factory, "p2"));
    }

    /// <summary>Het oude token is een rejoin-bewijs dat na de overname niets meer waard is.</summary>
    [Fact]
    public async Task RejoinGame_MetHetOudeTokenNaEenOvername_GeeftDePubliekeWeergaveEnRegistreertNiet()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var oldTab = await ApiTestHost.ConnectAsync(factory, client);
        await using var newTab = await ApiTestHost.ConnectAsync(factory, client);
        var presence = factory.Services.GetRequiredService<PlayerPresenceRegistry>();
        var gameId = await SetUpAsync(factory);

        await newTab.InvokeAsync<JoinGameResponse>("RejoinAsPlayer", gameId, "Bob");
        var stale = await oldTab.InvokeAsync<GameStateDto>("RejoinGame", gameId, "p2", BobsOldToken);

        Assert.Empty(PlayerOf(stale, "p2").Hand);
        Assert.False(presence.IsConnectionOf(oldTab.ConnectionId!, gameId, "p2"));
        Assert.True(presence.IsConnectionOf(newTab.ConnectionId!, gameId, "p2"));
    }

    [Fact]
    public async Task RejoinAsPlayer_VerwijdertDeEerdereConnectiesVanDeSpelerUitDePresence()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var oldTab = await ApiTestHost.ConnectAsync(factory, client);
        await using var newTab = await ApiTestHost.ConnectAsync(factory, client);
        var presence = factory.Services.GetRequiredService<PlayerPresenceRegistry>();
        var gameId = await SetUpAsync(factory);

        await oldTab.InvokeAsync<GameStateDto>("RejoinGame", gameId, "p2", BobsOldToken);
        Assert.True(presence.IsConnectionOf(oldTab.ConnectionId!, gameId, "p2"));

        await newTab.InvokeAsync<JoinGameResponse>("RejoinAsPlayer", gameId, "Bob");

        Assert.False(presence.IsConnectionOf(oldTab.ConnectionId!, gameId, "p2"));
        Assert.True(presence.IsConnectionOf(newTab.ConnectionId!, gameId, "p2"));
        Assert.Null(presence.AbsentSince(gameId, "p2"));
    }

    /// <summary>Een tabblad dat al speler A was en nu B overneemt, mag A's Hand niet blijven ontvangen.</summary>
    [Fact]
    public async Task RejoinAsPlayer_EenTabbladDatAlEenAndereSpelerWas_VerliestDieSpeler()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var tab = await ApiTestHost.ConnectAsync(factory, client);
        var presence = factory.Services.GetRequiredService<PlayerPresenceRegistry>();
        var gameId = await SetUpAsync(factory);

        await tab.InvokeAsync<JoinGameResponse>("RejoinAsPlayer", gameId, "Alice");
        await tab.InvokeAsync<JoinGameResponse>("RejoinAsPlayer", gameId, "Bob");

        Assert.True(presence.IsConnectionOf(tab.ConnectionId!, gameId, "p2"));
        Assert.False(presence.IsConnectionOf(tab.ConnectionId!, gameId, "p1"));
    }

    [Fact]
    public async Task RejoinAsPlayer_VoorEenSpelerOpAutoPass_HeftAutoPassOp()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var newTab = await ApiTestHost.ConnectAsync(factory, client);
        var gameId = await SetUpAsync(factory, bobIsAutoPass: true);

        var response = await newTab.InvokeAsync<JoinGameResponse>("RejoinAsPlayer", gameId, "Bob");

        Assert.False((await LoadAsync(factory, gameId)).Player("p2").IsAutoPass);
        Assert.False(PlayerOf(response.State, "p2").IsAutoPass);
    }

    /// <summary>Twee overnames na elkaar: het laatste token wint en alleen die connectie hoort nog bij de speler.</summary>
    [Fact]
    public async Task RejoinAsPlayer_TweeKeerNaElkaar_LaatAlleenDeLaatsteConnectieOver()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var first = await ApiTestHost.ConnectAsync(factory, client);
        await using var second = await ApiTestHost.ConnectAsync(factory, client);
        var presence = factory.Services.GetRequiredService<PlayerPresenceRegistry>();
        var gameId = await SetUpAsync(factory);

        var firstResponse = await first.InvokeAsync<JoinGameResponse>("RejoinAsPlayer", gameId, "Bob");
        var secondResponse = await second.InvokeAsync<JoinGameResponse>("RejoinAsPlayer", gameId, "Bob");

        Assert.NotEqual(firstResponse.SessionToken, secondResponse.SessionToken);
        Assert.Equal(secondResponse.SessionToken, await StoredTokenAsync(factory, "p2"));
        Assert.False(presence.IsConnectionOf(first.ConnectionId!, gameId, "p2"));
        Assert.True(presence.IsConnectionOf(second.ConnectionId!, gameId, "p2"));
    }
}
