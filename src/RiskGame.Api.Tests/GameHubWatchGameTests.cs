using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst de twee nieuwe bouwstenen voor de eerste frontend-plak (lobby end-to-end):
/// <c>WatchGame</c> als de enige aanroep die de TV na het navigeren naar
/// <c>/tv/:gameId</c> doet, en de group-broadcast die elke geslaagde lobby-actie naar
/// alle verbonden clients van hetzelfde spel pusht (niet alleen naar de aanroeper).
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubWatchGameTests(PostgresFixture postgres) : IAsyncLifetime
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

    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    public Task InitializeAsync()
    {
        _factory = ApiTestHost.Create(postgres);
        _client = _factory.CreateClient();

        return Task.CompletedTask;
    }

    public Task DisposeAsync()
    {
        _client.Dispose();
        _factory.Dispose();

        return Task.CompletedTask;
    }

    private async Task<string> CreateGameAsync()
    {
        var response = await _client.PostAsJsonAsync(
            "/games", new CreateGameRequest("standaard-43", Settings));
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<CreateGameResponse>();

        return body!.GameId;
    }

    private Task<HubConnection> ConnectAsync() => ApiTestHost.ConnectAsync(_factory, _client);

    [Fact]
    public async Task WatchGame_MetBekendeGameId_LevertHuidigeStateOp()
    {
        var gameId = await CreateGameAsync();
        await using var connection = await ConnectAsync();

        var state = await connection.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.Equal(gameId, state.GameId);
        Assert.Equal(GamePhaseDto.Lobby, state.Phase);
    }

    [Fact]
    public async Task WatchGame_MetOnbekendeGameId_WordtGeweigerd()
    {
        await using var connection = await ConnectAsync();

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("WatchGame", "ONBEKEND"));

        Assert.Contains("common.unknownGame", exception.Message);
    }

    [Fact]
    public async Task JoinGame_PushtBijgewerkteStateNaarEenAndereAlAanwezigeSpectator()
    {
        var gameId = await CreateGameAsync();

        await using var tv = await ConnectAsync();
        var received = new TaskCompletionSource<GameStateDto>();
        tv.On<GameStateDto>("GameStateUpdated", state => received.TrySetResult(state));
        await tv.InvokeAsync<GameStateDto>("WatchGame", gameId);

        await using var phone = await ConnectAsync();
        await phone.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");

        var pushed = await received.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.Single(pushed.Players);
        Assert.Equal("Alice", pushed.Players[0].Name);
    }

    [Fact]
    public async Task ChooseColor_PushtBijgewerkteStateNaarEenAndereSpelerInDezelfdeGroep()
    {
        var gameId = await CreateGameAsync();

        await using var aliceConnection = await ConnectAsync();
        var alice = await aliceConnection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");

        await using var bobConnection = await ConnectAsync();
        await bobConnection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");

        var received = new TaskCompletionSource<GameStateDto>();
        bobConnection.On<GameStateDto>("GameStateUpdated", state => received.TrySetResult(state));

        await aliceConnection.InvokeAsync<GameStateDto>("ChooseColor", gameId, alice.PlayerId, "red");

        var pushed = await received.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.Equal("red", pushed.Players.Single(player => player.Id == alice.PlayerId).ColorId);
        Assert.DoesNotContain("red", pushed.AvailableColorIds);
    }
}
