using Marten;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Effects;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// FO §9.2 (besluit gebruiker 2026-10-01): op een afgesloten gebied komen geen legers bij. Zijn al
/// iemands gebieden dicht, dan rondt hij Versterken af en vervalt zijn pool — met een regel in het
/// verloop, zodat de legers niet ongemerkt verdwijnen.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameHubLockedReinforceTests(PostgresFixture postgres)
{
    /// <summary>
    /// p1 bezit alleen de Oeral (Lawines in de Oeral sluit hem af) en Alaska naar keuze; p2 bezit
    /// Alberta. p1 staat in Versterken met 4 legers in de pool.
    /// </summary>
    private static async Task<string> SetUpAsync(WebApplicationFactory<Program> factory, bool alsoOwnsAlaska)
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var map = factory.Services.GetRequiredService<IMapDefinitionSource>().Load("standaard-43");

        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            StartingArmiesPresetId: "classic",
            TurnTimer: TimeSpan.FromMinutes(3),
            FortifyTimer: TimeSpan.FromMinutes(1),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: true);

        var alice = new Player("p1", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false);
        var bob = new Player("p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false);

        var territories = map.Territories
            .Select(territory => territory.Id switch
            {
                "ural" => new TerritoryOwnership(territory.Id, "p1", 3),
                "alaska" when alsoOwnsAlaska => new TerritoryOwnership(territory.Id, "p1", 1),
                "alberta" => new TerritoryOwnership(territory.Id, "p2", 2),
                _ => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0),
            })
            .ToArray();

        var lawines = new ActiveEffect(map.Events.Single(definition => definition.Id == "lawines-in-de-oeral").Effect);

        var state = new GameState(
            gameId,
            map,
            GamePhase.InProgress,
            settings,
            players: [alice, bob],
            territories,
            turnOrder: ["p1", "p2"],
            turnState: new TurnState(
                "p1", TurnPhase.Reinforce, new PhaseTimer(settings.TurnTimer, DateTimeOffset.UtcNow), PendingCombat: null,
                ArmiesRemaining: 4),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: [lawines],
            eventRound: EventRoundState.Empty with { CurrentEventId = "lawines-in-de-oeral" });

        await using var session = factory.Services.GetRequiredService<IDocumentStore>().LightweightSession();
        session.Store(state);
        await session.SaveChangesAsync();

        return gameId;
    }

    [Fact]
    public async Task PlaceReinforcements_OpAfgeslotenGebied_WordtGeweigerd()
    {
        await using var factory = ApiTestHost.Create(postgres);
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);
        var gameId = await SetUpAsync(factory, alsoOwnsAlaska: true);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync<GameStateDto>("PlaceReinforcements", gameId, "p1", "ural", 1));

        Assert.Contains("reinforce.territoryLocked", exception.Message);
    }

    [Fact]
    public async Task EndPhase_AllesAfgesloten_LaatDePoolVervallenMetEenRegelInHetVerloop()
    {
        await using var factory = ApiTestHost.Create(postgres);
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);
        var gameId = await SetUpAsync(factory, alsoOwnsAlaska: false);

        var state = await connection.InvokeAsync<GameStateDto>("EndPhase", gameId, "p1");

        Assert.Equal(TurnPhaseDto.Attack, state.TurnState!.TurnPhase);
        Assert.Equal(0, state.TurnState.ArmiesRemaining);
        var lapsed = state.RecentActions[0];
        Assert.Equal(RecentActionKindDto.ArmiesLapsed, lapsed.Kind);
        Assert.Equal("p1", lapsed.PlayerId);
        Assert.Equal(4, lapsed.Amount);
        Assert.Equal("lawines-in-de-oeral", lapsed.EventId);
    }

    [Fact]
    public async Task EndPhase_MetEenOpenGebied_BlijftGeweigerdZolangErLegersOverZijn()
    {
        await using var factory = ApiTestHost.Create(postgres);
        using var client = factory.CreateClient();
        await using var connection = await ApiTestHost.ConnectAsync(factory, client);
        var gameId = await SetUpAsync(factory, alsoOwnsAlaska: true);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync<GameStateDto>("EndPhase", gameId, "p1"));

        Assert.Contains("turnFlow.armiesRemaining", exception.Message);
    }
}
