using Marten;
using Microsoft.AspNetCore.SignalR;
using RiskGame.Api.Commands;
using RiskGame.Api.Endpoints;
using RiskGame.Api.Hubs;
using RiskGame.Persistence.Map;
using RiskGame.Persistence.Store;

var builder = WebApplication.CreateBuilder(args);

var mapsRoot = Path.Combine(AppContext.BaseDirectory, "data", "maps");

builder.Services.AddSingleton<IMapDefinitionSource>(new MapDefinitionSource(mapsRoot));
builder.Services.AddSingleton<IDocumentStore>(sp =>
{
    // Config pas hier uitlezen, niet vóór builder.Build(): WebApplicationFactory (Api.Tests)
    // voegt zijn testconfiguratie pas toe tijdens het bouwen van de host, dus een vroegere
    // lezing zou de test-overrides missen.
    var connectionString = sp.GetRequiredService<IConfiguration>().GetConnectionString("Postgres")
        ?? throw new InvalidOperationException("ConnectionStrings:Postgres ontbreekt in de configuratie.");

    return GameStoreFactory.Create(connectionString, sp.GetRequiredService<IMapDefinitionSource>());
});
builder.Services.AddScoped<LobbyCommandHandler>();
builder.Services.AddSignalR(options => options.AddFilter<HubExceptionLoggingFilter>());

var app = builder.Build();

app.MapGameHub();
app.MapGameEndpoints();

app.Run();

public partial class Program;
