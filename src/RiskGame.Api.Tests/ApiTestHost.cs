using Marten;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using RiskGame.Api.Services;
using RiskGame.Persistence.Map;

namespace RiskGame.Api.Tests;

/// <summary>
/// De enige plek waar een testhost en een hub-verbinding worden opgezet. Stond eerder als
/// bijna-identieke kopie in elke testklasse; één plek voorkomt dat een aanpassing (zoals het
/// vastzetten van het transport hieronder) tien keer los gedaan moet worden — DRY, src/CLAUDE.md.
/// </summary>
internal static class ApiTestHost
{
    /// <summary>
    /// Bouwt een testhost die de <see cref="IDocumentStore"/> en <see cref="IMapDefinitionSource"/>
    /// van de fixture deelt in plaats van eigen exemplaren op te bouwen.
    /// </summary>
    /// <param name="configureServices">Per-test-overrides, bijvoorbeeld een
    /// <see cref="SequenceRandomSource"/> of een <c>FakeTimeProvider</c>.</param>
    /// <param name="loggerProvider">Optionele logger-provider, voor tests die op logregels asserten.</param>
    /// <param name="withTurnTimer">Laat <see cref="TurnTimerBackgroundService"/> meedraaien. Standaard
    /// uit: die service pollt élk spel dat op <c>InProgress</c> staat, dus in een test die hem niet
    /// nodig heeft levert hij alleen achtergrondwerk op — en met een vooruitgezette klok zelfs
    /// ongevraagde fase-overgangen op spellen van andere tests.</param>
    public static WebApplicationFactory<Program> Create(
        PostgresFixture postgres,
        Action<IServiceCollection>? configureServices = null,
        ILoggerProvider? loggerProvider = null,
        bool withTurnTimer = false) =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            if (loggerProvider is not null)
            {
                builder.ConfigureLogging(logging => logging.AddProvider(loggerProvider));
            }

            // ConfigureTestServices, niet ConfigureServices: alleen deze draait gegarandeerd ná
            // de registraties van Program.cs. Bij een te vroege callback zou RemoveAll niets
            // vinden en zou Program alsnog zijn eigen store registreren.
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IDocumentStore>();
                services.RemoveAll<IMapDefinitionSource>();

                // Bewust de instance-overload van AddSingleton: de DI-container disposet alleen
                // wat hij zelf heeft aangemaakt, dus de gedeelde store overleeft het disposen van
                // deze host. Met een factory-overload zou de eerste testhost hem meenemen.
                services.AddSingleton(postgres.Store);
                services.AddSingleton(postgres.MapSource);

                if (!withTurnTimer)
                {
                    services.Remove(TurnTimerDescriptor(services));
                }

                configureServices?.Invoke(services);
            });

            // Geen ConnectionStrings:Postgres-override meer: de registratie die hem leest is
            // hierboven vervangen. Mocht dat vervangen ooit stuk gaan, dan valt Program terug op
            // zijn eigen registratie en faalt de host hard op de ontbrekende connectionstring —
            // luidruchtiger, en dus beter, dan stilzwijgend een tweede DocumentStore opbouwen.
        });

    public static async Task<HubConnection> ConnectAsync(
        WebApplicationFactory<Program> factory, HttpClient client)
    {
        var connection = new HubConnectionBuilder()
            .WithUrl(new Uri(client.BaseAddress!, "/hubs/game"), options =>
            {
                options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();

                // TestServer serveert geen WebSockets via HttpMessageHandlerFactory. Zonder deze
                // regel probeert de client die eerst tegen het echte http://localhost, wacht een
                // connect-timeout van seconden af, en valt daarna alsnog terug op een
                // HTTP-transport. Dat kostte ~4,15 s per verbinding en dus het leeuwendeel van de
                // looptijd van deze suite; het transport dat uiteindelijk gebruikt werd, verandert
                // hier niet.
                options.Transports = HttpTransportType.LongPolling;
            })
            .Build();

        await connection.StartAsync();

        return connection;
    }

    private static ServiceDescriptor TurnTimerDescriptor(IServiceCollection services) =>
        services.SingleOrDefault(
            descriptor => descriptor.ImplementationType == typeof(TurnTimerBackgroundService))
        ?? throw new InvalidOperationException(
            $"Geen IHostedService-descriptor voor {nameof(TurnTimerBackgroundService)} gevonden. "
            + "Twee mogelijke oorzaken: (a) de registratie in Program.cs is een factory-overload "
            + "geworden — dan is ImplementationType null en moet dit filter mee veranderen; (b) deze "
            + "callback draait vóór Program.cs, controleer dat hij via ConfigureTestServices loopt.");
}
