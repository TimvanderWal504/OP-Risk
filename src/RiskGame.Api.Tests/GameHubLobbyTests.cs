using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst de volledige TO §4-pijplijn voor de lobby-commando's end-to-end: een echte
/// SignalR-hubverbinding tegen een <see cref="WebApplicationFactory{TEntryPoint}"/>-host
/// met een echte Postgres-testcontainer, zoals <c>RiskGame.Persistence.Tests</c> voor de
/// projectie doet.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubLobbyTests(PostgresFixture postgres) : IAsyncLifetime
{
    private static readonly GameSettingsDto Settings = new(
        WinConditionDto.SecretMissions,
        SetupModeDto.Claiming,
        StartingArmies: 25,
        TurnTimerSeconds: 180,
        FortifyTimerSeconds: 60,
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentModeDto.Random,
        EventsEnabled: false);

    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;
    private CapturingLoggerProvider _logs = null!;

    public Task InitializeAsync()
    {
        _logs = new CapturingLoggerProvider();
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Postgres"] = postgres.ConnectionString,
                }));
            builder.ConfigureLogging(logging => logging.AddProvider(_logs));
        });

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

    private async Task<HubConnection> ConnectAsync()
    {
        var connection = new HubConnectionBuilder()
            .WithUrl(new Uri(_client.BaseAddress!, "/hubs/game"), options =>
            {
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
            })
            .Build();

        await connection.StartAsync();

        return connection;
    }

    [Fact]
    public async Task JoinGameEnChooseColor_MetGeldigeInvoer_LevertBijgewerkteStateOp()
    {
        var gameId = await CreateGameAsync();
        await using var connection = await ConnectAsync();

        var alice = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");

        Assert.Equal(2, bob.State.Players.Count);
        Assert.Contains("red", bob.State.AvailableColorIds);

        var afterColor = await connection.InvokeAsync<GameStateDto>(
            "ChooseColor", gameId, alice.PlayerId, "red");

        Assert.Equal("red", afterColor.Players.Single(player => player.Id == alice.PlayerId).ColorId);
        Assert.DoesNotContain("red", afterColor.AvailableColorIds);
    }

    [Fact]
    public async Task ChooseColor_MetAlBezetteKleur_WordtGeweigerd()
    {
        var gameId = await CreateGameAsync();
        await using var connection = await ConnectAsync();

        var alice = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, alice.PlayerId, "red");

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, bob.PlayerId, "red"));

        Assert.Contains("al gekozen", exception.Message);
    }

    [Fact]
    public async Task ChooseColor_MetAlBezetteKleur_WordtGelogdViaHubExceptionLoggingFilter()
    {
        var gameId = await CreateGameAsync();
        await using var connection = await ConnectAsync();

        var alice = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, alice.PlayerId, "red");

        await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, bob.PlayerId, "red"));

        Assert.Contains(_logs.Entries, entry =>
            entry.Category == typeof(HubExceptionLoggingFilter).FullName
            && entry.Level == LogLevel.Information
            && entry.Message.Contains("ChooseColor")
            && entry.Message.Contains("al gekozen"));
    }

    [Fact]
    public async Task JoinGame_VoorbijHetAantalBeschikbareKleuren_WordtGeweigerd()
    {
        var gameId = await CreateGameAsync();
        await using var connection = await ConnectAsync();

        var joined = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Speler 0");
        // Nog niemand heeft een kleur gekozen, dus dit is het totale aantal spelerskleuren
        // van de kaartvariant — precies de grens uit LobbyGuards.SlotIsAvailable.
        var colorCount = joined.State.AvailableColorIds.Count;

        for (var i = 1; i < colorCount; i++)
        {
            await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, $"Speler {i}");
        }

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Speler te veel"));

        Assert.Contains("vol", exception.Message);
    }
}
