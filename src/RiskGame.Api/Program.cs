using Marten;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.SignalR;
using RiskGame.Api;
using RiskGame.Api.Commands;
using RiskGame.Api.Endpoints;
using RiskGame.Api.Hubs;
using RiskGame.Api.Services;
using RiskGame.Persistence.Map;
using RiskGame.Persistence.Store;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.State;

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
builder.Services.AddSingleton<IRandomSource, SystemRandomSource>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<LobbyCommandHandler>();
builder.Services.AddScoped<OrderRollCommandHandler>();
builder.Services.AddScoped<SetupCommandHandler>();
builder.Services.AddScoped<ReinforceCommandHandler>();
builder.Services.AddScoped<AttackCommandHandler>();
builder.Services.AddScoped<TurnFlowCommandHandler>();
builder.Services.AddScoped<TvDisplayCommandHandler>();
builder.Services.AddHostedService<TurnTimerBackgroundService>();
// JoinGameRateLimitFilter houdt per-IP-tellerstate bij (TO §8) die tussen hub-aanroepen moet
// overleven — expliciet als singleton, anders zou SignalR er mogelijk telkens een verse,
// lege instantie van maken en is de hele maatregel een stille no-op.
builder.Services.AddSingleton<JoinGameRateLimitFilter>();
builder.Services.AddSignalR(options =>
{
    options.AddFilter<HubExceptionLoggingFilter>();
    options.AddFilter<JoinGameRateLimitFilter>();
});

// Vercel is een ander origin dan de API (docs/azure-hosting-deployment.md); zonder CORS
// weigert de browser zowel de `fetch`-aanroepen als de SignalR-handshake vanaf de
// frontend. Geen AllowCredentials: er lopen geen cookies/Authorization-headers mee,
// sessietokens (§6.3) gaan als expliciet hub-argument (RejoinGame), niet als header.
var allowedOrigin = builder.Configuration["AllowedOrigin"]
    ?? throw new InvalidOperationException("AllowedOrigin ontbreekt in de configuratie.");
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy => policy
        .WithOrigins(allowedOrigin)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

// Azure App Service (docs/azure-hosting-deployment.md) plaatst een eigen front-end vóór
// deze container; de container zelf heeft geen publiek IP en is alleen via die
// front-end-hop bereikbaar — een client kan de hop dus niet overslaan en zelf een
// X-Forwarded-For rechtstreeks bij de container afleveren. Daarom hier de tegenovergestelde
// keuze van de eerdere Tailscale-opzet: niet één specifiek loopback-adres vertrouwen, maar
// de onvermijdelijke platform-hop zelf (KnownProxies/KnownIPNetworks leeg = elke hop
// vertrouwd). Dat blijft even veilig voor JoinGameRateLimitFilter's per-IP-telling (TO §8),
// omdat de vertrouwde grens "het App Service-platform" is, niet "een client-bereikbaar
// netwerk".
var forwardedHeadersOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor,
};
forwardedHeadersOptions.KnownIPNetworks.Clear();
forwardedHeadersOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeadersOptions);

app.UseCors("Frontend");

// Health check voor Azure App Service (docs/azure-hosting-deployment.md §3) — bevestigt ook
// dat Marten daadwerkelijk bij Postgres kan, niet alleen dat het proces leeft. Zelfde
// sessiepatroon als GameEndpoints.cs' rechtstreekse IDocumentStore-reads.
app.MapGet("/health", async (IDocumentStore store) =>
{
    await using var session = store.QuerySession();
    await session.LoadAsync<GameState>("__health_check__");
    return Results.Ok();
});

app.MapGameHub();
app.MapGameEndpoints(mapsRoot);

app.Run();

public partial class Program;
