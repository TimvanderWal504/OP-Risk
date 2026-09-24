using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;

namespace RiskGame.Api.Tests;

/// <summary>
/// Plan-testronde-tv punt 2: de host stelt vanaf de telefoon de TV-weergave in
/// (<c>SetTvDisplay</c>), de server legt die per spel vast en pusht 'm via de gewone state-push
/// naar de TV; een nieuw spel kan de door de host-telefoon onthouden waarden meekrijgen.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubTvDisplayTests(PostgresFixture postgres) : IAsyncLifetime
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

    private static readonly TvDisplaySettingsDto DefaultTvDisplay = new(50, 50, 50, TvLanguageDto.Nl);

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

    private async Task<HttpResponseMessage> PostCreateGameAsync(TvDisplaySettingsDto? tvDisplay = null) =>
        await _client.PostAsJsonAsync("/games", new CreateGameRequest("standaard-43", Settings, tvDisplay));

    private async Task<string> CreateGameAsync(TvDisplaySettingsDto? tvDisplay = null)
    {
        var response = await PostCreateGameAsync(tvDisplay);
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<CreateGameResponse>())!.GameId;
    }

    private Task<HubConnection> ConnectAsync() => ApiTestHost.ConnectAsync(_factory, _client);

    private static Task<GameStateDto> SetTvDisplayAsync(
        HubConnection connection, string gameId, string playerId, TvDisplaySettingsDto settings) =>
        connection.InvokeAsync<GameStateDto>(
            "SetTvDisplay", gameId, playerId,
            settings.TextScale, settings.GlassOpacity, settings.GlassBlur, settings.Language);

    [Fact]
    public async Task WatchGame_ZonderInstelling_LevertDeDefaultAlsWaardeEnAlsStandaard()
    {
        var gameId = await CreateGameAsync();
        await using var tv = await ConnectAsync();

        var state = await tv.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.Equal(DefaultTvDisplay, state.TvDisplay);
        Assert.Equal(DefaultTvDisplay, state.TvDisplayDefault);
    }

    [Fact]
    public async Task SetTvDisplay_DoorDeHost_LegtDeWaardenVastEnPushtZeNaarDeTv()
    {
        var gameId = await CreateGameAsync();
        var wanted = new TvDisplaySettingsDto(75, 30, 0, TvLanguageDto.En);

        await using var tv = await ConnectAsync();
        var initial = await tv.InvokeAsync<GameStateDto>("WatchGame", gameId);

        await using var phone = await ConnectAsync();
        var alice = await phone.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");

        var pushed = new TaskCompletionSource<GameStateDto>();
        tv.On<GameStateDto>("GameStateUpdated", state =>
        {
            if (state.TvDisplay == wanted)
            {
                pushed.TrySetResult(state);
            }
        });

        var response = await SetTvDisplayAsync(phone, gameId, alice.PlayerId, wanted);
        var received = await pushed.Task.WaitAsync(TimeSpan.FromSeconds(5));

        Assert.Equal(wanted, response.TvDisplay);
        Assert.True(received.StateVersion > initial.StateVersion);

        // Een herladen TV krijgt dezelfde waarden terug.
        await using var reloadedTv = await ConnectAsync();
        var reloaded = await reloadedTv.InvokeAsync<GameStateDto>("WatchGame", gameId);
        Assert.Equal(wanted, reloaded.TvDisplay);
    }

    [Fact]
    public async Task SetTvDisplay_DoorEenNietHost_WordtGeweigerd()
    {
        var gameId = await CreateGameAsync();
        await using var connection = await ConnectAsync();

        await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            SetTvDisplayAsync(connection, gameId, bob.PlayerId, DefaultTvDisplay with { TextScale = 60 }));

        Assert.Contains("lobby.notHost", exception.Message);
    }

    [Theory]
    [InlineData(105)]
    [InlineData(7)]
    public async Task SetTvDisplay_MetOngeldigeWaarde_WordtGeweigerd(int textScale)
    {
        var gameId = await CreateGameAsync();
        await using var connection = await ConnectAsync();
        var alice = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            SetTvDisplayAsync(connection, gameId, alice.PlayerId, DefaultTvDisplay with { TextScale = textScale }));

        Assert.Contains("tvDisplay.invalidValue", exception.Message);
    }

    [Fact]
    public async Task SetTvDisplay_BuitenDeLobby_IsToegestaan()
    {
        var gameId = await CreateGameAsync();
        await using var connection = await ConnectAsync();
        var alice = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, alice.PlayerId, "red");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, bob.PlayerId, "blue");
        var started = await connection.InvokeAsync<GameStateDto>("StartGame", gameId, alice.PlayerId);
        Assert.NotEqual(GamePhaseDto.Lobby, started.Phase);

        var response = await SetTvDisplayAsync(
            connection, gameId, alice.PlayerId, DefaultTvDisplay with { Language = TvLanguageDto.En });

        Assert.Equal(TvLanguageDto.En, response.TvDisplay.Language);
    }

    /// <summary>
    /// Elite-code-review bevinding 1: de host kan de TV bijstellen terwijl er ook iets anders op
    /// dezelfde stream wordt geschreven. Twee gelijktijdige aanroepen moeten allebei slagen (de
    /// retry in <c>TvDisplayCommandHandler</c> vangt een botsing op het stream-versienummer op),
    /// en de eindstand is één van de twee — de laatste wint.
    /// </summary>
    [Fact]
    public async Task SetTvDisplay_TweeGelijktijdigeAanroepen_SlagenAllebei()
    {
        var gameId = await CreateGameAsync();
        await using var connection = await ConnectAsync();
        var alice = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");

        await using var second = await ConnectAsync();
        var first = DefaultTvDisplay with { TextScale = 60 };
        var other = DefaultTvDisplay with { TextScale = 80 };

        await Task.WhenAll(
            SetTvDisplayAsync(connection, gameId, alice.PlayerId, first),
            SetTvDisplayAsync(second, gameId, alice.PlayerId, other));

        var final = await connection.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.Contains(final.TvDisplay, new[] { first, other });
        Assert.Equal(alice.State.StateVersion + 2, final.StateVersion);
    }

    [Fact]
    public async Task CreateGame_MetOnthoudenTvDisplay_StartMetDieWaarden()
    {
        var remembered = new TvDisplaySettingsDto(65, 45, 90, TvLanguageDto.En);
        var gameId = await CreateGameAsync(remembered);
        await using var tv = await ConnectAsync();

        var state = await tv.InvokeAsync<GameStateDto>("WatchGame", gameId);

        Assert.Equal(remembered, state.TvDisplay);
    }

    [Fact]
    public async Task CreateGame_MetOngeldigeTvDisplay_GeeftBadRequest()
    {
        var response = await PostCreateGameAsync(DefaultTvDisplay with { GlassBlur = 101 });

        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }
}
