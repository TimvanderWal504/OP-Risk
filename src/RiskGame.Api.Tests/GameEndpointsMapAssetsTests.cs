using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst dat de kaartlaag-bestanden (TO §7.2) verbatim opvraagbaar zijn via twee
/// naam-specifieke routes — en dat er geen generieke static-file-hosting op de hele
/// `data/maps/{mapId}/`-map is opgezet, wat `missions.json`/`events.json` (FO §6.1/§9) vooraf
/// zichtbaar zou maken. Zie de doc-comment op <see cref="Endpoints.GameEndpoints.MapGameEndpoints"/>.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameEndpointsMapAssetsTests(PostgresFixture postgres) : IAsyncLifetime
{
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

    [Fact]
    public async Task TerritoriesGeoJson_IsOpvraagbaar_MetCacheControlEnGeldigeFeatures()
    {
        var response = await _client.GetAsync("/maps/standaard-43/territories.geo.json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("public, max-age=3600", response.Headers.CacheControl?.ToString());

        var body = await response.Content.ReadFromJsonAsync<GeoJsonEnvelope>();

        Assert.NotNull(body);
        Assert.Equal(43, body!.Features.Count);
    }

    [Fact]
    public async Task MapBackground_IsOpvraagbaar_AlsPngMetCacheControl()
    {
        var response = await _client.GetAsync("/maps/standaard-43/map-background.png");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("image/png", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("public, max-age=3600", response.Headers.CacheControl?.ToString());
    }

    /// <summary>
    /// Geen generieke static-file-route: een ander bestand uit dezelfde map (bevat o.a.
    /// <c>missions.json</c>/<c>events.json</c>, FO §6.1/§9) mag niet via een analoog pad
    /// opvraagbaar zijn — alleen de twee expliciet gedefinieerde routes bestaan.
    /// </summary>
    [Fact]
    public async Task AndereBestandenUitDeMapsMap_ZijnNietOpvraagbaar()
    {
        var response = await _client.GetAsync("/maps/standaard-43/missions.json");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>
    /// Een <c>mapId</c> die buiten <c>data/maps/</c> probeert te resolven (padtraversal) mag geen
    /// bestand teruggeven, ook niet als het opgevraagde bestand elders op schijf toevallig bestaat.
    /// </summary>
    [Theory]
    [InlineData("/maps/..%2f..%2fRiskGame.Api/territories.geo.json")]
    [InlineData("/maps/onbekende-variant/territories.geo.json")]
    public async Task OngeldigeOfOnbekendeMapId_GeeftNotFound(string path)
    {
        var response = await _client.GetAsync(path);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private sealed record GeoJsonEnvelope(List<object> Features);
}
