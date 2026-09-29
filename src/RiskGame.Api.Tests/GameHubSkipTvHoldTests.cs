using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;

namespace RiskGame.Api.Tests;

/// <summary>
/// "Verder op TV" (FO §2.2): de host laat de wachttijden op TV en telefoons eindigen. Alleen een
/// seintje naar de spelgroep — geen state, geen event.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubSkipTvHoldTests(PostgresFixture postgres) : IAsyncLifetime
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
        var response = await _client.PostAsJsonAsync("/games", new CreateGameRequest("standaard-43", Settings, null));
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<CreateGameResponse>())!.GameId;
    }

    [Fact]
    public async Task SkipTvHold_DoorDeHost_StuurtHetSeintjeNaarDeTv()
    {
        var gameId = await CreateGameAsync();
        await using var host = await ApiTestHost.ConnectAsync(_factory, _client);
        await using var tv = await ApiTestHost.ConnectAsync(_factory, _client);

        var alice = await host.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        await tv.InvokeAsync<GameStateDto>("WatchGame", gameId);

        var skipped = new TaskCompletionSource();
        tv.On("HoldsSkipped", () => skipped.TrySetResult());

        await host.InvokeAsync("SkipTvHold", gameId, alice.PlayerId);

        await skipped.Task.WaitAsync(TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task SkipTvHold_DoorEenNietHost_WordtGeweigerd()
    {
        var gameId = await CreateGameAsync();
        await using var connection = await ApiTestHost.ConnectAsync(_factory, _client);

        await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");

        var exception = await Assert.ThrowsAsync<HubException>(() => connection.InvokeAsync("SkipTvHold", gameId, bob.PlayerId));

        Assert.Contains("lobby.notHost", exception.Message);
    }
}
