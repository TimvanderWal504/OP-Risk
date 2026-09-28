using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;
using RiskGame.Rules.Abstractions;

namespace RiskGame.Api.Tests;

/// <summary>
/// <c>GetActionLog</c>: het volledige verloop voor het tabblad Spelverloop op de telefoon, los van
/// de state-update die er alleen de laatste <see cref="GameStateDtoMapper.TvRecentActionCount"/>
/// meestuurt (besluit gebruiker 2026-09-26).
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubActionLogTests(PostgresFixture postgres) : IAsyncLifetime
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
        // Zelfde vaste worpen als GameHubReinforceTests: Alice wint de order-roll meteen, zodat
        // TurnOrder vaststaat (bij een gelijke worp zou er opnieuw gegooid moeten worden).
        _factory = ApiTestHost.Create(
            postgres,
            services => services.AddSingleton<IRandomSource>(
                new SequenceRandomSource([0, 1, .. DeckShuffleFiller.Values, 6, 4, 3, 2])));
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
        var response = await _client.PostAsJsonAsync("/games", new CreateGameRequest("standaard-43", Settings));
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<CreateGameResponse>();

        return body!.GameId;
    }

    [Fact]
    public async Task GetActionLog_LevertMeerRegelsDanDeStateUpdate_NieuwsteEerst()
    {
        const int claims = GameStateDtoMapper.TvRecentActionCount + 2;
        var gameId = await CreateGameAsync();
        await using var connection = await ApiTestHost.ConnectAsync(_factory, _client);

        var alice = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Alice");
        var bob = await connection.InvokeAsync<JoinGameResponse>("JoinGame", gameId, "Bob");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, alice.PlayerId, "red");
        await connection.InvokeAsync<GameStateDto>("ChooseColor", gameId, bob.PlayerId, "blue");
        await connection.InvokeAsync<GameStateDto>("StartGame", gameId, alice.PlayerId);
        await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, alice.PlayerId);
        var roll = await connection.InvokeAsync<OrderRollResponse>("RollForOrder", gameId, bob.PlayerId);

        var turnOrder = roll.State.TurnOrder;
        var territoryIds = roll.State.Territories.Select(territory => territory.TerritoryId).Take(claims).ToArray();
        var latest = roll.State;

        for (var i = 0; i < territoryIds.Length; i++)
        {
            latest = await connection.InvokeAsync<GameStateDto>(
                "ClaimTerritory", gameId, turnOrder[i % turnOrder.Count], territoryIds[i]);
        }

        var log = await connection.InvokeAsync<IReadOnlyList<RecentActionDto>>("GetActionLog", gameId);

        Assert.Equal(GameStateDtoMapper.TvRecentActionCount, latest.RecentActions.Count);
        Assert.Equal(claims, log.Count);
        Assert.All(log, action => Assert.Equal(RecentActionKindDto.TerritoryClaimed, action.Kind));
        Assert.Equal(territoryIds.Reverse(), log.Select(action => action.TerritoryId));
        Assert.Equal(latest.RecentActions, log.Take(GameStateDtoMapper.TvRecentActionCount));
    }

    [Fact]
    public async Task GetActionLog_MetOnbekendeGameId_WordtGeweigerd()
    {
        await using var connection = await ApiTestHost.ConnectAsync(_factory, _client);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<IReadOnlyList<RecentActionDto>>("GetActionLog", "ONBEKEND"));

        Assert.Contains("common.unknownGame", exception.Message);
    }
}
