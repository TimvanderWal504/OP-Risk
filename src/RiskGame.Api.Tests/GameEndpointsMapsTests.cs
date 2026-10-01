using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using RiskGame.Api.Dtos;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Tests;

/// <summary>
/// Kaartkeuze in de lobby (FO §4.5, §10): <c>GET /maps</c> levert de kiesbare varianten, en
/// een <c>mapId</c> van de client wordt alleen geaccepteerd als het exact een bekende variant is.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameEndpointsMapsTests(PostgresFixture postgres) : IAsyncLifetime
{
    private static GameSettingsDto Settings(string presetId) => new(
        WinConditionDto.SecretMissions,
        SetupModeDto.Claiming,
        StartingArmiesPresetId: presetId,
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

    private async Task<MapSummaryDto[]> GetMapsAsync() =>
        (await _client.GetFromJsonAsync<MapSummaryDto[]>("/maps"))!;

    [Fact]
    public async Task Maps_LevertBeideVarianten_MetAantallenUitDeSpeeldata()
    {
        var maps = await GetMapsAsync();

        Assert.Equal(
            [
                new MapSummaryDto("standaard-43", IsDefault: true, TerritoryCount: 43, ContinentCount: 6, "classic"),
                new MapSummaryDto("wereld-49", IsDefault: false, TerritoryCount: 49, ContinentCount: 6, "classic-49"),
            ],
            maps);
    }

    [Fact]
    public async Task StandaardpresetVanElkeKaart_BestaatInDePresetsVanDieKaart()
    {
        foreach (var map in await GetMapsAsync())
        {
            var presets = await _client.GetFromJsonAsync<StartingArmiesPresetDto[]>(
                $"/maps/{map.MapId}/starting-armies-presets");

            Assert.Contains(presets!, preset => preset.Id == map.DefaultStartingArmiesPresetId);
        }
    }

    [Theory]
    [InlineData("bestaat-niet")]
    [InlineData("..")]
    public async Task Presets_VoorEenOnbekendeKaart_Is404(string mapId)
    {
        var response = await _client.GetAsync($"/maps/{Uri.EscapeDataString(mapId)}/starting-armies-presets");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GeometrieVanWereld49_IsOpvraagbaar()
    {
        using var document = System.Text.Json.JsonDocument.Parse(
            await _client.GetStringAsync("/maps/wereld-49/territories.geo.json"));

        Assert.Equal(49, document.RootElement.GetProperty("features").GetArrayLength());
    }

    [Fact]
    public async Task SpelOpWereld49_GebruiktDe49Gebieden()
    {
        var created = await _client.PostAsJsonAsync("/games", new CreateGameRequest("wereld-49", Settings("classic-49")));
        created.EnsureSuccessStatusCode();
        var gameId = (await created.Content.ReadFromJsonAsync<CreateGameResponse>())!.GameId;

        var territories = await _client.GetFromJsonAsync<TerritoryCatalogDto[]>($"/games/{gameId}/territories");

        Assert.Equal(49, territories!.Length);
        Assert.Contains(territories, territory => territory.Id == "hawaii");
    }

    [Theory]
    [InlineData("bestaat-niet")]
    [InlineData("../maps/standaard-43")]
    [InlineData("standaard-43/")]
    public async Task SpelAanmaken_MetEenOnbekendeOfPadachtigeKaart_WordtGeweigerd(string mapId)
    {
        var response = await _client.PostAsJsonAsync("/games", new CreateGameRequest(mapId, Settings("classic")));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = await response.Content.ReadFromJsonAsync<ValidationError[]>();
        Assert.Equal("lobby.unknownMap", Assert.Single(errors!).Code);
    }
}
