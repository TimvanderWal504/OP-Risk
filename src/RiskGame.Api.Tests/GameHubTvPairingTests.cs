using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;

namespace RiskGame.Api.Tests;

/// <summary>
/// "TV koppelen": de TV vraagt een koppelcode aan (<c>RegisterTv</c>) en de host-telefoon stuurt
/// daarmee een spelcode naar precies die TV (<c>SendGameToTv</c> → <c>TvPaired</c>).
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubTvPairingTests(PostgresFixture postgres) : IAsyncLifetime
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
    public async Task SendGameToTv_MetGeldigeKoppelcode_StuurtSpelcodeNaarDieTv()
    {
        var gameId = await CreateGameAsync();
        await using var tv = await ConnectAsync();
        var paired = new TaskCompletionSource<TvPairedMessage>();
        tv.On<TvPairedMessage>("TvPaired", message => paired.TrySetResult(message));
        var pairingCode = await tv.InvokeAsync<string>("RegisterTv");

        await using var host = await ConnectAsync();
        await host.InvokeAsync("SendGameToTv", pairingCode, gameId);

        var message = await paired.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal(gameId, message.GameId);
    }

    [Fact]
    public async Task SendGameToTv_KoppelcodeIsHoofdletterOngevoelig()
    {
        var gameId = await CreateGameAsync();
        await using var tv = await ConnectAsync();
        var paired = new TaskCompletionSource<TvPairedMessage>();
        tv.On<TvPairedMessage>("TvPaired", message => paired.TrySetResult(message));
        var pairingCode = await tv.InvokeAsync<string>("RegisterTv");

        await using var host = await ConnectAsync();
        await host.InvokeAsync("SendGameToTv", pairingCode.ToLowerInvariant(), gameId);

        var message = await paired.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal(gameId, message.GameId);
    }

    [Fact]
    public async Task SendGameToTv_MetOnbekendeKoppelcode_IsOngeldig()
    {
        var gameId = await CreateGameAsync();
        await using var host = await ConnectAsync();

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            host.InvokeAsync("SendGameToTv", "ONBEKEND", gameId));

        Assert.Contains("tvPairing.unknownCode", exception.Message);
    }

    [Fact]
    public async Task SendGameToTv_KoppelcodeIsEenmaligBruikbaar()
    {
        var gameId = await CreateGameAsync();
        await using var tv = await ConnectAsync();
        var pairingCode = await tv.InvokeAsync<string>("RegisterTv");

        await using var host = await ConnectAsync();
        await host.InvokeAsync("SendGameToTv", pairingCode, gameId);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            host.InvokeAsync("SendGameToTv", pairingCode, gameId));

        Assert.Contains("tvPairing.unknownCode", exception.Message);
    }

    [Fact]
    public async Task SendGameToTv_MetOnbekendSpel_IsOngeldigEnLaatDeKoppelcodeGeldig()
    {
        var gameId = await CreateGameAsync();
        await using var tv = await ConnectAsync();
        var paired = new TaskCompletionSource<TvPairedMessage>();
        tv.On<TvPairedMessage>("TvPaired", message => paired.TrySetResult(message));
        var pairingCode = await tv.InvokeAsync<string>("RegisterTv");

        await using var host = await ConnectAsync();
        var exception = await Assert.ThrowsAsync<HubException>(() =>
            host.InvokeAsync("SendGameToTv", pairingCode, "ONBEKEND"));
        Assert.Contains("common.unknownGame", exception.Message);

        await host.InvokeAsync("SendGameToTv", pairingCode, gameId);

        var message = await paired.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal(gameId, message.GameId);
    }

    [Fact]
    public async Task RegisterTv_OpnieuwAanroepen_LaatDeVorigeKoppelcodeVervallen()
    {
        var gameId = await CreateGameAsync();
        await using var tv = await ConnectAsync();
        var first = await tv.InvokeAsync<string>("RegisterTv");
        var second = await tv.InvokeAsync<string>("RegisterTv");

        await using var host = await ConnectAsync();
        var exception = await Assert.ThrowsAsync<HubException>(() =>
            host.InvokeAsync("SendGameToTv", first, gameId));

        Assert.NotEqual(first, second);
        Assert.Contains("tvPairing.unknownCode", exception.Message);
    }
}
