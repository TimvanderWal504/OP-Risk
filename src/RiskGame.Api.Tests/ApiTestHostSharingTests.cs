using Marten;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using RiskGame.Api.Commands;
using RiskGame.Api.Services;
using RiskGame.Persistence.Map;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst dat <see cref="ApiTestHost"/> daadwerkelijk deelt wat hij belooft. Zonder deze test
/// is "de store wordt gedeeld" een aanname: een vervanging die niet aanslaat levert stilzwijgend
/// een tweede <see cref="IDocumentStore"/> op, en dan draaien de tests weer op een eigen
/// schema-diff en Roslyn-codegen per host zonder dat iets faalt.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class ApiTestHostSharingTests(PostgresFixture postgres)
{
    [Fact]
    public void TestHost_GebruiktDeDocumentStoreEnMapSourceVanDeFixture()
    {
        using var factory = ApiTestHost.Create(postgres);

        Assert.Same(postgres.Store, factory.Services.GetRequiredService<IDocumentStore>());
        Assert.Same(postgres.MapSource, factory.Services.GetRequiredService<IMapDefinitionSource>());
    }

    /// <summary>
    /// De command handlers zijn scoped (<c>Program.cs</c>), dus ze moeten uit een scope komen —
    /// uit de root-provider resolven zou een ander antwoord kunnen geven dan wat de hub in een
    /// echte aanroep krijgt.
    /// </summary>
    [Fact]
    public void CommandHandlers_KrijgenDezelfdeGedeeldeStoreGeinjecteerd()
    {
        using var factory = ApiTestHost.Create(postgres);
        using var scope = factory.Services.CreateScope();

        Assert.Same(postgres.Store, scope.ServiceProvider.GetRequiredService<IDocumentStore>());
        Assert.NotNull(scope.ServiceProvider.GetRequiredService<AttackCommandHandler>());
    }

    /// <summary>
    /// De standaard-testhost draait <see cref="TurnTimerBackgroundService"/> niet mee; alleen
    /// tests die de aftelservice zelf bewijzen zetten hem aan. Zie de doc-comment op
    /// <see cref="ApiTestHost.Create"/> voor waarom.
    /// </summary>
    [Fact]
    public void TurnTimerBackgroundService_DraaitAlleenMeeAlsDeTestErOmVraagt()
    {
        using var zonder = ApiTestHost.Create(postgres);
        using var met = ApiTestHost.Create(postgres, withTurnTimer: true);

        Assert.DoesNotContain(
            zonder.Services.GetServices<IHostedService>(), service => service is TurnTimerBackgroundService);
        Assert.Contains(
            met.Services.GetServices<IHostedService>(), service => service is TurnTimerBackgroundService);
    }
}
