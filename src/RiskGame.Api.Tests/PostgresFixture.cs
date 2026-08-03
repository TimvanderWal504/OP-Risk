using Marten;
using RiskGame.Persistence.Map;
using RiskGame.Persistence.Store;
using Testcontainers.PostgreSql;

namespace RiskGame.Api.Tests;

/// <summary>
/// Start één echte Postgres-container voor de duur van de testrun — zelfde aanpak als
/// <c>RiskGame.Persistence.Tests/PostgresFixture.cs</c>. Bewust gedupliceerd in plaats van
/// gedeeld via een testproject-op-testproject-referentie: dat zou twee losse testprojecten
/// aan elkaar koppelen.
/// </summary>
/// <remarks>
/// De fixture is óók eigenaar van de <see cref="IDocumentStore"/> en de
/// <see cref="IMapDefinitionSource"/>. Beide zijn duur om op te bouwen (Roslyn-codegen en een
/// schema-diff onder advisory lock respectievelijk het inlezen en valideren van de volledige
/// kaartvariant) en beide zijn thread-safe en zonder per-test-state, dus ze horen één keer per
/// run te bestaan in plaats van één keer per test. <see cref="ApiTestHost"/> hangt ze in elke
/// testhost; het schema wordt hier één keer toegepast in plaats van in de testklassen.
/// </remarks>
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container =
        new PostgreSqlBuilder("postgres:16-alpine").Build();

    private DocumentStore? _store;

    public string ConnectionString => _container.GetConnectionString();

    public IMapDefinitionSource MapSource { get; } =
        new MapDefinitionSource(Path.Combine(AppContext.BaseDirectory, "data", "maps"));

    public IDocumentStore Store =>
        _store ?? throw new InvalidOperationException(
            $"{nameof(Store)} is pas beschikbaar nadat {nameof(InitializeAsync)} is voltooid.");

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        _store = GameStoreFactory.Create(ConnectionString, MapSource);
        await _store.Storage.ApplyAllConfiguredChangesToDatabaseAsync();
    }

    public async Task DisposeAsync()
    {
        if (_store is not null)
        {
            await _store.DisposeAsync();
        }

        await _container.DisposeAsync();
    }

    /// <summary>
    /// Gooit alle documenten en events weg. Alleen nodig voor tests die
    /// <c>TurnTimerBackgroundService</c> daadwerkelijk meedraaien: die pollt
    /// <c>Query&lt;GameState&gt;().Where(Phase == InProgress)</c> ongefilterd, dus zonder
    /// opruimen ziet zo'n test óók de spellen van alle eerdere tests — en schuift die met een
    /// vooruitgezette <c>FakeTimeProvider</c> daadwerkelijk door. Alle andere tests werken op
    /// een eigen <c>gameId</c> en hebben dit niet nodig.
    /// </summary>
    public Task ResetAsync() => Store.Advanced.ResetAllData();
}

[CollectionDefinition(Name)]
public sealed class PostgresCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "Postgres";
}
