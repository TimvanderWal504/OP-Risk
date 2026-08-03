using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using RiskGame.Api.Dtos;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst <c>GET /games/{gameId}/territories</c> (TO §7, statische territoriumcatalogus voor
/// de startopstelling-schermen): geen SignalR nodig, zelfde REST-testopzet als de
/// <c>POST /games</c>-tests in <see cref="GameHubSetupTests"/>.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameEndpointsTerritoriesTests(PostgresFixture postgres) : IAsyncLifetime
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

    [Fact]
    public async Task GetTerritories_MetBekendeGameId_LevertVolledigeCatalogusOp()
    {
        var gameId = await CreateGameAsync();

        var response = await _client.GetAsync($"/games/{gameId}/territories");
        response.EnsureSuccessStatusCode();

        var territories = await response.Content.ReadFromJsonAsync<TerritoryCatalogDto[]>();

        Assert.Equal(43, territories!.Length);
        Assert.All(territories, territory =>
        {
            Assert.False(string.IsNullOrWhiteSpace(territory.Id));
            Assert.False(string.IsNullOrWhiteSpace(territory.Continent));
        });
    }

    [Fact]
    public async Task GetTerritories_MetOnbekendeGameId_Levert404Op()
    {
        var response = await _client.GetAsync("/games/ONBEKEND/territories");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
