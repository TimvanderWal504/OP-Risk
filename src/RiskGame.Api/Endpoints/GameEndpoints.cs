using Marten;
using RiskGame.Api.Commands;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Map;
using RiskGame.Rules.State;

namespace RiskGame.Api.Endpoints;

/// <summary>Minimal API-routes voor spelbeheer buiten de SignalR-hub om (TO §2: geen realtime nodig).</summary>
public static class GameEndpoints
{
    public static IEndpointRouteBuilder MapGameEndpoints(this IEndpointRouteBuilder app, string mapsRoot)
    {
        // Statische startlegers-presets (FO §5.1/§10) van een kaartvariant — nodig vóórdat een
        // spel bestaat, zodat de host in CreateGameForm uit Klassiek/Modern/Klassiek-49 kan
        // kiezen (frontend/CLAUDE.md: geen spelregel-berekening in de client, dus de server
        // levert de tabel, niet alleen het gekozen id).
        app.MapGet("/maps/{mapId}/starting-armies-presets", (string mapId, IMapDefinitionSource mapSource) =>
        {
            var presets = mapSource.Load(mapId).StartingArmiesPresets
                .Select(preset => new StartingArmiesPresetDto(preset.Id, preset.ArmiesByPlayerCount))
                .ToArray();

            return Results.Ok(presets);
        });

        // Kaartlaag-bestanden (TO §7.2): verbatim, bevroren data/*-bestanden, geen DTO/parsing.
        // Bewust twee naam-specifieke routes en geen generieke static-file-hosting op
        // data/maps/{mapId}/ — die map bevat ook missions.json/events.json (FO §6.1/§9), die
        // niet vooraf opvraagbaar mogen zijn. Cache-Control: bevroren data, maar geen
        // "immutable"/oneindige waarde, zodat een toekomstige asset-vervanging op dezelfde url
        // binnen het uur doorkomt i.p.v. browser-cache-eeuwig te blijven hangen.
        // {mapId} wordt eerst tegen mapsRoot gevalideerd (geen "..", geen padscheidingstekens),
        // anders resolvet Path.Combine hier zonder controle naar willekeurige bestanden buiten
        // de kaartvariant-map, inclusief de zojuist genoemde missions.json/events.json.
        app.MapGet("/maps/{mapId}/territories.geo.json", (string mapId, HttpContext context) =>
        {
            if (!TryResolveMapFilePath(mapsRoot, mapId, "territories.geo.json", out var filePath))
            {
                return Results.NotFound();
            }

            context.Response.Headers.CacheControl = "public, max-age=3600";

            return Results.File(filePath, contentType: "application/json");
        });

        app.MapGet("/maps/{mapId}/map-background.png", (string mapId, HttpContext context) =>
        {
            if (!TryResolveMapFilePath(mapsRoot, mapId, "map-background-final.png", out var filePath))
            {
                return Results.NotFound();
            }

            context.Response.Headers.CacheControl = "public, max-age=3600";

            return Results.File(filePath, contentType: "image/png");
        });

        var games = app.MapGroup("/games");

        games.MapPost("", async (CreateGameRequest request, LobbyCommandHandler lobbyCommands) =>
        {
            var result = await lobbyCommands.CreateGameAsync(request);

            return result.IsSuccess
                ? Results.Created($"/games/{result.Value.GameId}", result.Value)
                : Results.BadRequest(result.Errors);
        });

        // Statische territoriumcatalogus (naam + continent) van de kaartvariant van dit spel —
        // geen domeinmutatie, dus rechtstreeks via IDocumentStore i.p.v. een command handler
        // (zelfde directe load-patroon als GameHub.WatchGame).
        games.MapGet("{gameId}/territories", async (string gameId, IDocumentStore store) =>
        {
            await using var session = store.QuerySession();
            var state = await session.LoadAsync<GameState>(gameId);

            if (state is null)
            {
                return Results.NotFound();
            }

            var territories = state.Map.Territories
                .Select(territory => new TerritoryCatalogDto(territory.Id, territory.Continent))
                .ToArray();

            return Results.Ok(territories);
        });

        return app;
    }

    /// <summary>
    /// Bouwt het pad naar <paramref name="fileName"/> binnen de kaartvariant-map
    /// <paramref name="mapId"/> op, en weigert als het resultaat buiten
    /// <paramref name="mapsRoot"/> zou vallen (padtraversal via bv. "..") of als de
    /// kaartvariant-map niet bestaat.
    /// </summary>
    private static bool TryResolveMapFilePath(string mapsRoot, string mapId, string fileName, out string filePath)
    {
        filePath = "";

        var resolvedMapsRoot = Path.GetFullPath(mapsRoot);
        var resolvedMapDirectory = Path.GetFullPath(Path.Combine(mapsRoot, mapId));

        if (!resolvedMapDirectory.StartsWith(resolvedMapsRoot + Path.DirectorySeparatorChar, StringComparison.Ordinal))
        {
            return false;
        }

        if (!Directory.Exists(resolvedMapDirectory))
        {
            return false;
        }

        filePath = Path.Combine(resolvedMapDirectory, fileName);
        return true;
    }
}
