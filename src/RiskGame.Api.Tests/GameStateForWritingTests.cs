using JasperFx.Events;
using Marten;
using RiskGame.Api.Commands;
using RiskGame.Persistence.Events;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// <see cref="GameStateForWriting"/> los van een echte race, met een vaste volgorde: laden A, laden
/// B, opslaan B, opslaan A. Precies het venster dat Marten zonder verwachte streamversie niet ziet —
/// twee commando's die op dezelfde state besluiten en elkaar niet overlappen bij het opslaan.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameStateForWritingTests(PostgresFixture postgres)
{
    /// <summary>Een spel mét stream (versie 1), zoals in productie na <c>GameCreated</c>.</summary>
    private async Task<string> SeedGameWithStreamAsync()
    {
        var gameId = $"game-{Guid.NewGuid()}";
        var state = new GameState(
            gameId,
            postgres.MapSource.Load("standaard-43"),
            GamePhase.Lobby,
            new GameSettings(
                WinCondition.WorldDomination,
                SetupMode.Claiming,
                StartingArmiesPresetId: "classic",
                TurnTimer: TimeSpan.FromMinutes(3),
                FortifyTimer: TimeSpan.FromMinutes(1),
                RolesEnabled: false,
                RoleAssignment: RoleAssignmentMode.Random,
                EventsEnabled: false),
            players: [new Player("p1", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false)],
            territories: [],
            turnOrder: [],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        await using (var seed = postgres.Store.LightweightSession())
        {
            seed.Store(state);
            await seed.SaveChangesAsync();
        }

        // TurnEnded vouwt zonder gevolg (geen openstaande bonus): alleen om een stream te hebben.
        await using (var start = postgres.Store.LightweightSession())
        {
            start.Events.Append(gameId, new TurnEnded(gameId, "p1"));
            await start.SaveChangesAsync();
        }

        return gameId;
    }

    [Fact]
    public async Task EenAppendNaHetLaden_LaatHetOpslaanVanDeVerouderdeBeslissingMislukken()
    {
        var gameId = await SeedGameWithStreamAsync();

        await using var stale = postgres.Store.LightweightSession();
        Assert.NotNull(await GameStateForWriting.LoadAsync(stale, gameId));

        await using (var other = postgres.Store.LightweightSession())
        {
            await GameStateForWriting.LoadAsync(other, gameId);
            other.Events.Append(gameId, new TurnEnded(gameId, "p1"));
            await other.SaveChangesAsync();
        }

        stale.Events.Append(gameId, new TurnEnded(gameId, "p1"));

        await Assert.ThrowsAsync<EventStreamUnexpectedMaxEventIdException>(() => stale.SaveChangesAsync());
    }

    [Fact]
    public async Task ZonderTussentijdseAppend_SlaatHetGewoonOp()
    {
        var gameId = await SeedGameWithStreamAsync();

        await using (var session = postgres.Store.LightweightSession())
        {
            await GameStateForWriting.LoadAsync(session, gameId);
            session.Events.Append(gameId, new TurnEnded(gameId, "p1"));
            await session.SaveChangesAsync();
        }

        await using var query = postgres.Store.QuerySession();
        Assert.Equal(2, (await query.Events.FetchStreamStateAsync(gameId))!.Version);
    }

    [Fact]
    public async Task OnbekendSpel_LevertNull()
    {
        await using var session = postgres.Store.LightweightSession();

        Assert.Null(await GameStateForWriting.LoadAsync(session, $"game-{Guid.NewGuid()}"));
    }
}
