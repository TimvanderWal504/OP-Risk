using RiskGame.Api.Hubs;

namespace RiskGame.Api.Endpoints;

/// <summary>SignalR-hub mappings, los van de Minimal API-routes (TO §6).</summary>
public static class HubEndpoints
{
    public static IEndpointRouteBuilder MapGameHub(this IEndpointRouteBuilder app)
    {
        app.MapHub<GameHub>("/hubs/game");

        return app;
    }
}
