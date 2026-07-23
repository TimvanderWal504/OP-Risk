using Testcontainers.PostgreSql;

namespace RiskGame.Api.Tests;

/// <summary>
/// Start één echte Postgres-container voor de duur van de testklasse — zelfde aanpak
/// als <c>RiskGame.Persistence.Tests/PostgresFixture.cs</c>. Bewust gedupliceerd in
/// plaats van gedeeld via een testproject-op-testproject-referentie: voor twintig regels
/// is dat onnodige koppeling tussen twee losse testprojecten.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container =
        new PostgreSqlBuilder("postgres:16-alpine").Build();

    public string ConnectionString => _container.GetConnectionString();

    public Task InitializeAsync() => _container.StartAsync();

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();
}

[CollectionDefinition(Name)]
public sealed class PostgresCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "Postgres";
}
