using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst TO §8's rate limiting op <see cref="GameHub.JoinGame"/>
/// (<see cref="JoinGameRateLimitFilter"/>): meer dan het toegestane aantal pogingen per IP
/// binnen het venster wordt geweigerd met <c>common.tooManyJoinAttempts</c>, terwijl pogingen
/// eronder gewoon slagen. Elke poging joint een eigen, vers spel (elke aanroep is op zichzelf
/// een geldige join) zodat alleen de rate-limiter, niet een lobby-regel, de weigering verklaart.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class JoinGameRateLimitFilterTests(PostgresFixture postgres)
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

    /// <summary>Zelfde als <see cref="CreateFactory()"/>, met een besturbare klok voor het
    /// venster-reset-scenario — zelfde patroon als <c>GameHubAttackTests</c>'s
    /// <c>FakeTimeProvider</c>-overload.</summary>
    private WebApplicationFactory<Program> CreateFactory(FakeTimeProvider timeProvider) =>
        ApiTestHost.Create(postgres, services => services.AddSingleton<TimeProvider>(timeProvider));

    private static async Task<string> CreateGameAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync(
            "/games", new CreateGameRequest("standaard-43", Settings));
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<CreateGameResponse>();

        return body!.GameId;
    }

    [Fact]
    public async Task JoinGame_MeerDanDeDrempelVanuitHetzelfdeIp_WordtGeweigerd()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        // 30 geslaagde joins (de drempel zelf, JoinGameRateLimitFilter.MaxAttemptsPerWindow) —
        // stuk voor stuk op een eigen, vers spel zodat elke aanroep op zichzelf geldig is.
        for (var i = 0; i < 30; i++)
        {
            var gameId = await CreateGameAsync(client);
            await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, $"Speler {i}");
        }

        // De 31e poging vanaf dezelfde TestServer-verbinding (dus hetzelfde IP) overschrijdt
        // de drempel en moet geweigerd worden — ook al is het doelspel op zichzelf net zo
        // geldig als de voorgaande 30.
        var overflowGameId = await CreateGameAsync(client);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<JoinGameResponse>("JoinGame", overflowGameId, "Speler te veel"));

        Assert.Contains("common.tooManyJoinAttempts", exception.Message);
    }

    [Fact]
    public async Task JoinGame_NaHetVerstrijkenVanHetVenster_TeltOpnieuwVanafNul()
    {
        var timeProvider = new FakeTimeProvider(DateTimeOffset.UtcNow);
        await using var factory = CreateFactory(timeProvider);
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        // Fase 1: precies de drempel (30, JoinGameRateLimitFilter.MaxAttemptsPerWindow) — moet
        // allemaal slagen, zelfde als de vorige test.
        for (var i = 0; i < 30; i++)
        {
            var gameId = await CreateGameAsync(client);
            await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, $"Speler {i}");
        }

        // Venster (5 minuten, JoinGameRateLimitFilter.Window) ruim laten verstrijken.
        timeProvider.Advance(TimeSpan.FromMinutes(6));

        // Fase 2: nog eens 30 pogingen ná het verstrijken van het venster. Was de teller blijven
        // doortellen i.p.v. te resetten, dan zou de éérste aanroep hier al de 31e in totaal zijn
        // en meteen geweigerd worden — dit bewijst dus specifiek het reset-gedrag, niet alleen
        // dat er "nog wat budget over was".
        for (var i = 0; i < 30; i++)
        {
            var gameId = await CreateGameAsync(client);
            await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, $"Speler-na-reset {i}");
        }
    }
}
