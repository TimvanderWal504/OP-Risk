using Marten;
using RiskGame.Api.Commands;
using RiskGame.Api.Dtos;
using RiskGame.Rules.State;

namespace RiskGame.Api.Endpoints;

/// <summary>Minimal API-routes voor spelbeheer buiten de SignalR-hub om (TO §2: geen realtime nodig).</summary>
public static class GameEndpoints
{
    public static IEndpointRouteBuilder MapGameEndpoints(this IEndpointRouteBuilder app)
    {
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
}
