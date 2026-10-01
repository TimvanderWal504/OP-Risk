using Marten;
using Microsoft.AspNetCore.SignalR;
using RiskGame.Api.Commands;
using RiskGame.Api.Hubs;
using RiskGame.Rules.State;

namespace RiskGame.Api.Services;

/// <summary>
/// De host-uitval (FO §11.1, TO §4.1): is de host van een lopend spel <see cref="GracePeriod"/>
/// onafgebroken zonder verbinding, dan gaat hij op auto-pass en het host-schap naar de volgende speler
/// (<see cref="AutoPassCommandHandler.MarkHostAbsentAsync"/>). Eén ronde per aanroep; het aftellen doet
/// <see cref="HostAbsenceBackgroundService"/>. Los van die service, zodat tests een ronde direct kunnen
/// draaien met een eigen klok.
/// </summary>
/// <remarks>
/// Loopt alleen de afwezige spelers uit <see cref="PlayerPresenceRegistry"/> door en laadt pas een spel
/// als iemand de grens voorbij is — niet elke ronde alle spellen. Spelers van spellen die afgelopen
/// zijn of niet meer bestaan, worden vergeten; die van spellen in de lobby of de startopstelling
/// blijven staan, want zo'n spel kan nog gaan lopen met een host die al weg is.
/// </remarks>
public sealed class HostAbsenceMonitor(
    IDocumentStore store,
    PlayerPresenceRegistry presence,
    AutoPassCommandHandler autoPassCommands,
    IHubContext<GameHub, IGameClient> hubContext,
    TimeProvider timeProvider)
{
    /// <summary>FO §11.1: zo lang mag de host weg zijn voordat het host-schap overgaat.</summary>
    public static readonly TimeSpan GracePeriod = TimeSpan.FromMinutes(2);

    public async Task CheckOnceAsync(CancellationToken cancellationToken = default)
    {
        var cutoff = timeProvider.GetUtcNow() - GracePeriod;
        var absent = presence.AbsentPlayers(cutoff);

        foreach (var game in absent.GroupBy(entry => entry.GameId, entry => entry.PlayerId))
        {
            cancellationToken.ThrowIfCancellationRequested();

            await using var session = store.QuerySession();
            var state = await session.LoadAsync<GameState>(game.Key, cancellationToken);

            if (state is null || state.Phase == GamePhase.Finished)
            {
                foreach (var playerId in game)
                {
                    presence.Forget(game.Key, playerId);
                }

                continue;
            }

            if (state.Phase != GamePhase.InProgress)
            {
                continue;
            }

            foreach (var playerId in game.Where(id => state.HasPlayer(id) && state.Player(id).IsHost))
            {
                // Opnieuw kijken vlak vóór het commando: verbond de host terwijl het spel laadde
                // opnieuw, dan mag hij zijn host-schap niet alsnog kwijtraken. Het venster is zo
                // milliseconden; helemaal dicht kan niet met aanwezigheid buiten de event-store.
                if (presence.AbsentSince(game.Key, playerId) is { } since && since <= cutoff)
                {
                    await MarkHostAbsentAsync(game.Key, playerId);
                }
            }
        }
    }

    private async Task MarkHostAbsentAsync(string gameId, string hostPlayerId)
    {
        var result = await autoPassCommands.MarkHostAbsentAsync(gameId, hostPlayerId);

        if (!result.IsSuccess || result.Value is null)
        {
            return;
        }

        await using var session = store.QuerySession();
        var streamState = await session.Events.FetchStreamStateAsync(gameId);
        var versionedState = result.Value.State with { StateVersion = (int)(streamState?.Version ?? 0) };

        foreach (var combat in result.Value.Combats)
        {
            await CombatNarration.BroadcastAsync(hubContext.Clients, gameId, combat, versionedState);
        }

        await GameStatePush.BroadcastAsync(hubContext.Clients, gameId, versionedState);
    }
}
