using RiskGame.Api.Commands;
using RiskGame.Api.Dtos;

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

        return app;
    }
}
