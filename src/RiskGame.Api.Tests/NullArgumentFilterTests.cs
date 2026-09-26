using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using RiskGame.Api.Dtos;
using RiskGame.Api.Hubs;

namespace RiskGame.Api.Tests;

/// <summary>
/// Bewijst <see cref="NullArgumentFilter"/>: een <c>null</c> voor een niet-nullable
/// hub-parameter wordt een validatiefout (<c>common.missingArgument</c>), geen serverfout.
/// Aanleiding: <c>PlaceInitialArmy</c> met een lege gebieds-id gaf een
/// <see cref="ArgumentNullException"/> uit <c>GameState.HasTerritory</c>.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class NullArgumentFilterTests(PostgresFixture postgres)
{
    private WebApplicationFactory<Program> CreateFactory() => ApiTestHost.Create(postgres);

    [Fact]
    public async Task PlaceInitialArmy_MetNullAlsGebied_GeeftMissingArgumentIPlaatsVanServerfout()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", "ABC123", "speler", null));

        Assert.Contains("common.missingArgument", exception.Message);
        Assert.Contains("territoryId", exception.Message);
    }

    [Fact]
    public async Task HubAanroepZonderNull_GaatDoorNaarDeHandler()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);

        var exception = await Assert.ThrowsAsync<HubException>(() =>
            connection.InvokeAsync<GameStateDto>("PlaceInitialArmy", "ABC123", "speler", "alaska"));

        Assert.Contains("common.unknownGame", exception.Message);
    }
}
