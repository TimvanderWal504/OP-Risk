using Marten;
using Microsoft.Extensions.DependencyInjection;
using RiskGame.Api.Commands;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Map;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// <see cref="GameWriteLock"/> (TO §5.2): commando's op hetzelfde spel lopen na elkaar, zodat de
/// tweede altijd op de state ná de eerste beslist — geen lost update.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class GameWriteLockTests(PostgresFixture postgres)
{
    private static readonly TimeSpan BlockedLongEnough = TimeSpan.FromMilliseconds(300);

    private async Task<string> SetUpGameAsync()
    {
        var gameId = $"game-{Guid.NewGuid()}";

        await using var session = postgres.Store.LightweightSession();
        session.Events.StartStream<GameState>(
            gameId,
            new GameCreated(gameId, "standaard-43", new GameSettings(
                WinCondition.SecretMissions,
                SetupMode.Claiming,
                StartingArmiesPresetId: "classic",
                TurnTimer: TimeSpan.FromMinutes(3),
                FortifyTimer: TimeSpan.FromMinutes(1),
                RolesEnabled: false,
                RoleAssignment: RoleAssignmentMode.Random,
                EventsEnabled: false)));
        await session.SaveChangesAsync();

        return gameId;
    }

    private static TvDisplaySettingsChanged TextScale(string gameId, int textScale) =>
        new(gameId, textScale, GlassOpacity: 50, GlassBlur: 50, TvLanguage.Nl, DiceScale: 50);

    [Fact]
    public async Task EenTweedeSchrijver_WachtTotDeEersteHeeftOpgeslagen_EnZietDiensWijziging()
    {
        var gameId = await SetUpGameAsync();

        await using var first = postgres.Store.LightweightSession();
        await first.LoadForWritingAsync(gameId);

        var second = Task.Run(async () =>
        {
            await using var session = postgres.Store.LightweightSession();
            var state = await session.LoadForWritingAsync(gameId);
            session.Events.Append(gameId, TextScale(gameId, state!.TvDisplay.TextScale + 10));
            await session.SaveChangesAsync();

            return state.TvDisplay.TextScale;
        });

        await Task.Delay(BlockedLongEnough);
        Assert.False(second.IsCompleted);

        first.Events.Append(gameId, TextScale(gameId, 70));
        await first.SaveChangesAsync();

        // De tweede laadde pas ná de eerste: hij zag 70, niet de oorspronkelijke waarde.
        Assert.Equal(70, await second.WaitAsync(TimeSpan.FromSeconds(5)));

        await using var check = postgres.Store.QuerySession();
        Assert.Equal(80, (await check.LoadAsync<GameState>(gameId))!.TvDisplay.TextScale);
    }

    /// <summary>Een commando dat faalt en niets opslaat, geeft de lock vrij bij het disposen van de sessie.</summary>
    [Fact]
    public async Task EenSchrijverZonderOpslaan_GeeftDeLockVrijBijHetSluiten()
    {
        var gameId = await SetUpGameAsync();

        var first = postgres.Store.LightweightSession();
        await first.LoadForWritingAsync(gameId);

        var second = Task.Run(async () =>
        {
            await using var session = postgres.Store.LightweightSession();
            return await session.LoadForWritingAsync(gameId);
        });

        await Task.Delay(BlockedLongEnough);
        Assert.False(second.IsCompleted);

        await first.DisposeAsync();

        Assert.NotNull(await second.WaitAsync(TimeSpan.FromSeconds(5)));
    }

    [Fact]
    public async Task SchrijversOpVerschillendeSpellen_WachtenNietOpElkaar()
    {
        var oneGameId = await SetUpGameAsync();
        var otherGameId = await SetUpGameAsync();

        await using var first = postgres.Store.LightweightSession();
        await first.LoadForWritingAsync(oneGameId);

        await using var second = postgres.Store.LightweightSession();
        var other = await second.LoadForWritingAsync(otherGameId).WaitAsync(TimeSpan.FromSeconds(5));

        Assert.NotNull(other);
    }

    /// <summary>Een houder die blijft hangen, laat een wachter na een time-out falen in plaats van eindeloos wachten.</summary>
    [Fact]
    public async Task DeLock_HeeftEenTimeOutAlleenVoorDezeTransactie()
    {
        var gameId = await SetUpGameAsync();

        await using var session = postgres.Store.LightweightSession();
        await session.LoadForWritingAsync(gameId);

        var timeout = (await session.QueryAsync<string>("select current_setting('lock_timeout')")).Single();
        Assert.Equal("10s", timeout);
    }
}
