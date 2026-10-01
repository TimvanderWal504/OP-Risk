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
        // De kiesbare kaartvarianten voor CreateGameForm (FO §4.5, §10). Aantallen komen uit
        // de geparste kaart, niet uit map.json, zodat ze nooit van de speeldata afwijken.
        app.MapGet("/maps", (IMapCatalog catalog, IMapDefinitionSource mapSource) =>
        {
            var maps = catalog.Variants
                .Select(variant =>
                {
                    var map = mapSource.Load(variant.MapId);

                    return new MapSummaryDto(
                        variant.MapId,
                        variant.IsDefault,
                        map.Territories.Count,
                        map.Continents.Count,
                        variant.DefaultStartingArmiesPresetId);
                })
                .ToArray();

            return Results.Ok(maps);
        });

        // Statische startlegers-presets (FO §5.1/§10) van een kaartvariant — nodig vóórdat een
        // spel bestaat, zodat de host in CreateGameForm uit Klassiek/Modern/Klassiek-49 kan
        // kiezen (frontend/CLAUDE.md: geen spelregel-berekening in de client, dus de server
        // levert de tabel, niet alleen het gekozen id). Alleen voor een bekende variant: de
        // mapId wordt anders ongecontroleerd een pad in MapDefinitionSource.
        app.MapGet("/maps/{mapId}/starting-armies-presets", (string mapId, IMapCatalog catalog, IMapDefinitionSource mapSource) =>
        {
            if (!catalog.Contains(mapId))
            {
                return Results.NotFound();
            }

            var presets = mapSource.Load(mapId).StartingArmiesPresets
                .Select(preset => new StartingArmiesPresetDto(preset.Id, preset.ArmiesByPlayerCount))
                .ToArray();

            return Results.Ok(presets);
        });

        // Kaartlaag-bestand (TO §7.2): verbatim, bevroren data/*-bestand, geen DTO/parsing.
        // Bewust een naam-specifieke route en geen generieke static-file-hosting op
        // data/maps/{mapId}/ — die map bevat ook missions.json/events.json (FO §6.1/§9), die
        // niet vooraf opvraagbaar mogen zijn. Cache-Control: bevroren data, maar geen
        // "immutable"/oneindige waarde, zodat een toekomstige asset-vervanging op dezelfde url
        // binnen het uur doorkomt i.p.v. browser-cache-eeuwig te blijven hangen.
        // {mapId} moet een variant uit de catalogus zijn (zie ServeMapFile), anders resolvet
        // Path.Combine hier naar willekeurige bestanden buiten de kaartvariant-map, inclusief de
        // zojuist genoemde missions.json/events.json.
        //
        // De vroegere `/maps/{mapId}/map-background.png`-route (statische kaartartwork) is op
        // 2026-08-07 verwijderd: de kaart gebruikt sindsdien de gedeelde TV-stage-illustratie +
        // een eigen scrim i.p.v. een per-kaart achtergrondasset (zie TO §7.2).
        app.MapGet("/maps/{mapId}/territories.geo.json", (string mapId, IMapCatalog catalog, HttpContext context) =>
            ServeMapFile(mapsRoot, catalog, mapId, "territories.geo.json", context));

        // Grenzen (FO §4.2/§4.3) voor de gestippelde zeeverbindingen op het TV-bord — zelfde
        // verbatim, naam-specifieke kaartlaag-route als hierboven. Geen geheime informatie: de
        // aangrenzing is openbaar speelbord (en staat al in TerritoryCatalogDto.NeighborTerritoryIds).
        app.MapGet("/maps/{mapId}/adjacency_validated.json", (string mapId, IMapCatalog catalog, HttpContext context) =>
            ServeMapFile(mapsRoot, catalog, mapId, "adjacency_validated.json", context));

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
                .Select(territory => new TerritoryCatalogDto(
                    territory.Id,
                    territory.Continent,
                    state.Map.Adjacency.Neighbours(territory.Id).ToArray()))
                .ToArray();

            return Results.Ok(territories);
        });

        return app;
    }

    /// <summary>
    /// Eén bevroren kaartlaag-bestand verbatim als JSON, met de gedeelde Cache-Control. Alleen
    /// voor een variant uit de catalogus: dat is een exact bekende mapnaam, dus het pad kan niet
    /// buiten <paramref name="mapsRoot"/> uitkomen (geen "..", geen padscheidingstekens).
    /// </summary>
    private static IResult ServeMapFile(
        string mapsRoot, IMapCatalog catalog, string mapId, string fileName, HttpContext context)
    {
        if (!catalog.Contains(mapId))
        {
            return Results.NotFound();
        }

        context.Response.Headers.CacheControl = "public, max-age=3600";

        return Results.File(Path.Combine(mapsRoot, mapId, fileName), contentType: "application/json");
    }
}
